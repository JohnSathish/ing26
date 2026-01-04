<?php
/**
 * Create News
 * Admin only
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/csrf.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Require admin
$user = requireAdmin();

// Validate CSRF
validateCSRF();

// Get input
$input = json_decode(file_get_contents('php://input'), true);

$title = sanitizeInput($input['title'] ?? '', 'string');
$content = $input['content'] ?? '';
$excerpt = sanitizeInput($input['excerpt'] ?? '', 'string');
$featuredImage = sanitizeInput($input['featured_image'] ?? null, 'string');
$eventDate = sanitizeInput($input['event_date'] ?? null, 'string');
$isFeatured = isset($input['is_featured']) ? (bool)$input['is_featured'] : false;
$isPublished = isset($input['is_published']) ? (bool)$input['is_published'] : false;
$publishedAt = $input['published_at'] ?? null;

// Validation
if (empty($title) || empty($content)) {
    http_response_code(400);
    echo json_encode(['error' => 'Title and content are required']);
    exit;
}

// Generate slug from title
$slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
$slug = preg_replace('/-+/', '-', $slug);
$slug = trim($slug, '-');

if (empty($slug)) {
    $slug = 'news-' . time();
}

// Ensure unique slug
try {
    $db = Database::getInstance()->getConnection();
    
    $checkStmt = $db->prepare("SELECT id FROM news WHERE slug = :slug");
    $checkStmt->execute(['slug' => $slug]);
    if ($checkStmt->fetch()) {
        $slug .= '-' . time();
    }
    
    // Set published_at if publishing
    if ($isPublished && $publishedAt === null) {
        $publishedAt = date('Y-m-d H:i:s');
    }
    
    // Check if event_date column exists (for backward compatibility)
    $columnCheck = $db->query("SHOW COLUMNS FROM news LIKE 'event_date'");
    $hasEventDate = $columnCheck && $columnCheck->rowCount() > 0;
    
    // Build INSERT query based on column existence
    if ($hasEventDate) {
        $stmt = $db->prepare("
            INSERT INTO news (title, slug, content, excerpt, featured_image, event_date, is_featured, is_published, published_at, created_by)
            VALUES (:title, :slug, :content, :excerpt, :featured_image, :event_date, :is_featured, :is_published, :published_at, :created_by)
        ");
        
        $stmt->execute([
            'title' => $title,
            'slug' => $slug,
            'content' => $content,
            'excerpt' => $excerpt,
            'featured_image' => $featuredImage,
            'event_date' => $eventDate ?: null,
            'is_featured' => $isFeatured ? 1 : 0,
            'is_published' => $isPublished ? 1 : 0,
            'published_at' => $publishedAt,
            'created_by' => $user['id']
        ]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO news (title, slug, content, excerpt, featured_image, is_featured, is_published, published_at, created_by)
            VALUES (:title, :slug, :content, :excerpt, :featured_image, :is_featured, :is_published, :published_at, :created_by)
        ");
        
        $stmt->execute([
            'title' => $title,
            'slug' => $slug,
            'content' => $content,
            'excerpt' => $excerpt,
            'featured_image' => $featuredImage,
            'is_featured' => $isFeatured ? 1 : 0,
            'is_published' => $isPublished ? 1 : 0,
            'published_at' => $publishedAt,
            'created_by' => $user['id']
        ]);
    }
    
    $id = $db->lastInsertId();
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('create', 'news', $id);
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'slug' => $slug,
        'message' => 'News created successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("News create error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create news']);
}


