<?php
/**
 * Create Banner
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

$type = sanitizeInput($input['type'] ?? '', 'string');
$title = sanitizeInput($input['title'] ?? '', 'string');
$subtitle = sanitizeInput($input['subtitle'] ?? '', 'string');
$content = $input['content'] ?? '';
$image = sanitizeInput($input['image'] ?? null, 'string');
$linkUrl = sanitizeInput($input['link_url'] ?? null, 'url');
$orderIndex = isset($input['order_index']) ? intval($input['order_index']) : 0;
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : true;

// Validation
if (empty($type) || !in_array($type, ['hero', 'flash_news'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid type (hero or flash_news) is required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        INSERT INTO banners (type, title, subtitle, content, image, link_url, order_index, is_active)
        VALUES (:type, :title, :subtitle, :content, :image, :link_url, :order_index, :is_active)
    ");
    
    $stmt->execute([
        'type' => $type,
        'title' => $title,
        'subtitle' => $subtitle,
        'content' => $content,
        'image' => $image,
        'link_url' => $linkUrl,
        'order_index' => $orderIndex,
        'is_active' => $isActive ? 1 : 0
    ]);
    
    $id = $db->lastInsertId();
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('create', 'banner', $id);
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Banner created successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Banner create error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create banner']);
}


