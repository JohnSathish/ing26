<?php
/**
 * Update Gallery Item
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
$type = sanitizeInput($input['type'] ?? null, 'string');
$filePath = sanitizeInput($input['file_path'] ?? null, 'string');
$thumbnail = sanitizeInput($input['thumbnail'] ?? null, 'string');
$description = sanitizeInput($input['description'] ?? null, 'string');
$category = sanitizeInput($input['category'] ?? null, 'string');
$isFeatured = isset($input['is_featured']) ? (bool)$input['is_featured'] : null;
$orderIndex = isset($input['order_index']) ? intval($input['order_index']) : null;

// Build update query
$updates = [];
$params = ['id' => $id];

if ($title !== null) {
    $updates[] = "title = :title";
    $params['title'] = $title;
}

if ($type !== null) {
    if (!in_array($type, ['photo', 'video'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid type']);
        exit;
    }
    $updates[] = "type = :type";
    $params['type'] = $type;
}

if ($filePath !== null) {
    $updates[] = "file_path = :file_path";
    $params['file_path'] = $filePath;
}

if ($thumbnail !== null) {
    $updates[] = "thumbnail = :thumbnail";
    $params['thumbnail'] = $thumbnail;
}

if ($description !== null) {
    $updates[] = "description = :description";
    $params['description'] = $description;
}

if ($category !== null) {
    $updates[] = "category = :category";
    $params['category'] = $category;
}

if ($isFeatured !== null) {
    $updates[] = "is_featured = :is_featured";
    $params['is_featured'] = $isFeatured ? 1 : 0;
}

if ($orderIndex !== null) {
    $updates[] = "order_index = :order_index";
    $params['order_index'] = $orderIndex;
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['error' => 'No fields to update']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $sql = "UPDATE gallery SET " . implode(', ', $updates) . " WHERE id = :id AND deleted_at IS NULL";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Gallery item not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('update', 'gallery', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Gallery item updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Gallery update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update gallery item']);
}

