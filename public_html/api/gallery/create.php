<?php
/**
 * Create Gallery Item
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
$type = sanitizeInput($input['type'] ?? '', 'string');
$filePath = sanitizeInput($input['file_path'] ?? '', 'string');
$thumbnail = sanitizeInput($input['thumbnail'] ?? null, 'string');
$description = sanitizeInput($input['description'] ?? '', 'string');
$category = sanitizeInput($input['category'] ?? null, 'string');
$isFeatured = isset($input['is_featured']) ? (bool)$input['is_featured'] : false;
$orderIndex = isset($input['order_index']) ? intval($input['order_index']) : 0;

// Validation
if (empty($title) || empty($type) || empty($filePath)) {
    http_response_code(400);
    echo json_encode(['error' => 'Title, type, and file_path are required']);
    exit;
}

if (!in_array($type, ['photo', 'video'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Type must be photo or video']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        INSERT INTO gallery (title, type, file_path, thumbnail, description, category, is_featured, order_index)
        VALUES (:title, :type, :file_path, :thumbnail, :description, :category, :is_featured, :order_index)
    ");
    
    $stmt->execute([
        'title' => $title,
        'type' => $type,
        'file_path' => $filePath,
        'thumbnail' => $thumbnail,
        'description' => $description,
        'category' => $category,
        'is_featured' => $isFeatured ? 1 : 0,
        'order_index' => $orderIndex
    ]);
    
    $id = $db->lastInsertId();
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('create', 'gallery', $id);
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Gallery item created successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Gallery create error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create gallery item']);
}

