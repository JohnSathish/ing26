<?php
/**
 * Update Message
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
$authorName = sanitizeInput($input['author_name'] ?? null, 'string');
$authorTitle = sanitizeInput($input['author_title'] ?? null, 'string');
$authorImage = sanitizeInput($input['author_image'] ?? null, 'string');
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : null;

// Auto-populate author_name from title if title is provided but author_name is not
if ($title !== null && ($authorName === null || empty($authorName))) {
    $authorName = trim(explode(',', $title)[0]) ?: 'Provincial';
}

// Auto-populate author_title from title if title is provided but author_title is not
if ($title !== null && ($authorTitle === null || empty($authorTitle))) {
    if (stripos($title, 'Provincial') !== false) {
        $authorTitle = 'Provincial';
    } else {
        $parts = explode(',', $title);
        $authorTitle = isset($parts[1]) ? trim($parts[1]) : '';
    }
}

// Build update query
$updates = [];
$params = ['id' => $id];

if ($title !== null) {
    $updates[] = "title = :title";
    $params['title'] = $title;
}

if ($content !== null) {
    $updates[] = "content = :content";
    $params['content'] = $content;
}

if ($authorName !== null) {
    $updates[] = "author_name = :author_name";
    $params['author_name'] = $authorName;
}

if ($authorTitle !== null) {
    $updates[] = "author_title = :author_title";
    $params['author_title'] = $authorTitle;
}

if ($authorImage !== null) {
    $updates[] = "author_image = :author_image";
    $params['author_image'] = $authorImage;
}

if ($isActive !== null) {
    $updates[] = "is_active = :is_active";
    $params['is_active'] = $isActive ? 1 : 0;
    
    // Deactivate other messages if this one is being activated
    if ($isActive) {
        try {
            $db = Database::getInstance()->getConnection();
            $db->exec("UPDATE messages SET is_active = 0 WHERE id != " . intval($id));
        } catch (PDOException $e) {
            error_log("Message update error (deactivate others): " . $e->getMessage());
        }
    }
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['error' => 'No fields to update']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $sql = "UPDATE messages SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Message not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('update', 'message', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Message updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Message update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update message']);
}


