<?php
/**
 * Update Council Member
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
$role = sanitizeInput($input['role'] ?? null, 'string');
$image = sanitizeInput($input['image'] ?? null, 'string');
$bio = $input['bio'] ?? null;
$dimension = sanitizeInput($input['dimension'] ?? null, 'string');
$commission = sanitizeInput($input['commission'] ?? null, 'string');
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : null;
$orderIndex = isset($input['order_index']) ? intval($input['order_index']) : null;

// Build update query
$updates = [];
$params = ['id' => $id];

if ($name !== null) {
    $updates[] = "name = :name";
    $params['name'] = $name;
}

if ($role !== null) {
    $updates[] = "role = :role";
    $params['role'] = $role;
}

if ($image !== null) {
    $updates[] = "image = :image";
    $params['image'] = $image;
}

if ($bio !== null) {
    $updates[] = "bio = :bio";
    $params['bio'] = $bio;
}

if ($dimension !== null) {
    $updates[] = "dimension = :dimension";
    $params['dimension'] = $dimension;
}

if ($commission !== null) {
    $updates[] = "commission = :commission";
    $params['commission'] = $commission;
}

if ($isActive !== null) {
    $updates[] = "is_active = :is_active";
    $params['is_active'] = $isActive ? 1 : 0;
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
    
    $sql = "UPDATE council_members SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Council member not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('update', 'council_member', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Council member updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Council update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update council member']);
}

