<?php
/**
 * Create Message
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
requireAdmin();

// Validate CSRF
validateCSRF();

// Get input
$input = json_decode(file_get_contents('php://input'), true);

$title = sanitizeInput($input['title'] ?? '', 'string');
$content = $input['content'] ?? '';
$authorName = sanitizeInput($input['author_name'] ?? '', 'string');
$authorTitle = sanitizeInput($input['author_title'] ?? '', 'string');
$authorImage = sanitizeInput($input['author_image'] ?? null, 'string');
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : true;

// Auto-populate author_name from title if not provided
if (empty($authorName) && !empty($title)) {
    $authorName = trim(explode(',', $title)[0]) ?: 'Provincial';
}

// Auto-populate author_title from title if not provided
if (empty($authorTitle) && !empty($title)) {
    if (stripos($title, 'Provincial') !== false) {
        $authorTitle = 'Provincial';
    } else {
        $parts = explode(',', $title);
        $authorTitle = isset($parts[1]) ? trim($parts[1]) : '';
    }
}

// Validation
if (empty($title) || empty($content)) {
    http_response_code(400);
    echo json_encode(['error' => 'Title and content are required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Deactivate other messages if this one is active
    if ($isActive) {
        $db->exec("UPDATE messages SET is_active = 0");
    }
    
    $stmt = $db->prepare("
        INSERT INTO messages (title, content, author_name, author_title, author_image, is_active)
        VALUES (:title, :content, :author_name, :author_title, :author_image, :is_active)
    ");
    
    $stmt->execute([
        'title' => $title,
        'content' => $content,
        'author_name' => $authorName,
        'author_title' => $authorTitle,
        'author_image' => $authorImage,
        'is_active' => $isActive ? 1 : 0
    ]);
    
    $id = $db->lastInsertId();
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('create', 'message', $id);
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Message created successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Message create error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create message']);
}


