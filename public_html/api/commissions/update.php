<?php
/**
 * Update Commission
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
$name = sanitizeInput($input['name'] ?? null, 'string');
$description = $input['description'] ?? null;
$icon = sanitizeInput($input['icon'] ?? null, 'string');
$orderIndex = isset($input['order_index']) ? intval($input['order_index']) : null;
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : null;

// Build update query
$updates = [];
$params = ['id' => $id];

if ($name !== null) {
    $updates[] = "name = :name";
    $params['name'] = $name;
}

if ($description !== null) {
    $updates[] = "description = :description";
    $params['description'] = $description;
}

if ($icon !== null) {
    $updates[] = "icon = :icon";
    $params['icon'] = $icon;
}

if ($orderIndex !== null) {
    $updates[] = "order_index = :order_index";
    $params['order_index'] = $orderIndex;
}

if ($isActive !== null) {
    $updates[] = "is_active = :is_active";
    $params['is_active'] = $isActive ? 1 : 0;
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['error' => 'No fields to update']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $sql = "UPDATE commissions SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Commission not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('update', 'commission', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Commission updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Commission update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update commission']);
}

