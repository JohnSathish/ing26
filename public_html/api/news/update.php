<?php
/**
 * Update News
 * Admin only
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/csrf.php';

// Only allow PUT/PATCH
if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH'])) {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Require admin
requireAdmin();

// Validate CSRF
validateCSRF();

// Get ID
$id = intval($_GET['id'] ?? 0);
$input = json_decode(file_get_contents('php://input'), true);

if (empty($id)) {
    $id = intval($input['id'] ?? 0);
}

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid ID']);
    exit;
}

// Get input
$title = sanitizeInput($input['title'] ?? null, 'string');
$content = $input['content'] ?? null;
$excerpt = sanitizeInput($input['excerpt'] ?? null, 'string');
$featuredImage = sanitizeInput($input['featured_image'] ?? null, 'string');
// Get event_date directly from input to preserve empty strings
$eventDate = isset($input['event_date']) ? trim($input['event_date']) : null;
$isFeatured = isset($input['is_featured']) ? (bool)$input['is_featured'] : null;
$isPublished = isset($input['is_published']) ? (bool)$input['is_published'] : null;
$publishedAt = $input['published_at'] ?? null;

// Check if event_date column exists (for backward compatibility)
$hasEventDate = false;
try {
    $db = Database::getInstance()->getConnection();
    $columnCheck = $db->query("SHOW COLUMNS FROM news LIKE 'event_date'");
    $hasEventDate = $columnCheck && $columnCheck->rowCount() > 0;
} catch (Exception $e) {
    $hasEventDate = false;
}

// Build update query
$updates = [];
$params = ['id' => $id];

if ($title !== null) {
    $updates[] = "title = :title";
    $params['title'] = $title;
    
    // Regenerate slug if title changes
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
    $slug = preg_replace('/-+/', '-', $slug);
    $slug = trim($slug, '-');
    if (!empty($slug)) {
        $updates[] = "slug = :slug";
        $params['slug'] = $slug;
    }
}

if ($content !== null) {
    $updates[] = "content = :content";
    $params['content'] = $content;
}

if ($excerpt !== null) {
    $updates[] = "excerpt = :excerpt";
    $params['excerpt'] = $excerpt;
}

if ($featuredImage !== null) {
    $updates[] = "featured_image = :featured_image";
    $params['featured_image'] = $featuredImage;
}

if ($hasEventDate) {
    // Always update event_date if it's in the input (even if empty string, to clear it)
    if (isset($input['event_date'])) {
        $updates[] = "event_date = :event_date";
        // Convert empty string to null for database
        $params['event_date'] = ($eventDate === null || $eventDate === '') ? null : $eventDate;
    }
}

if ($isFeatured !== null) {
    $updates[] = "is_featured = :is_featured";
    $params['is_featured'] = $isFeatured ? 1 : 0;
}

if ($isPublished !== null) {
    $updates[] = "is_published = :is_published";
    $params['is_published'] = $isPublished ? 1 : 0;
    
    // Set published_at if publishing for first time
    if ($isPublished && $publishedAt === null) {
        $updates[] = "published_at = NOW()";
    }
}

if ($publishedAt !== null) {
    $updates[] = "published_at = :published_at";
    $params['published_at'] = $publishedAt;
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['error' => 'No fields to update']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $sql = "UPDATE news SET " . implode(', ', $updates) . " WHERE id = :id AND deleted_at IS NULL";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'News not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('update', 'news', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'News updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("News update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update news']);
}


