<?php
/**
 * Create Council Member
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

$name = sanitizeInput($input['name'] ?? '', 'string');
$role = sanitizeInput($input['role'] ?? '', 'string');
$image = sanitizeInput($input['image'] ?? null, 'string');
$bio = $input['bio'] ?? '';
$dimension = sanitizeInput($input['dimension'] ?? null, 'string');
$commission = sanitizeInput($input['commission'] ?? null, 'string');
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : true;
$orderIndex = isset($input['order_index']) ? intval($input['order_index']) : 0;

// Validation
if (empty($name) || empty($role)) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and role are required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        INSERT INTO council_members (name, role, image, bio, dimension, commission, is_active, order_index)
        VALUES (:name, :role, :image, :bio, :dimension, :commission, :is_active, :order_index)
    ");
    
    $stmt->execute([
        'name' => $name,
        'role' => $role,
        'image' => $image,
        'bio' => $bio,
        'dimension' => $dimension,
        'commission' => $commission,
        'is_active' => $isActive ? 1 : 0,
        'order_index' => $orderIndex
    ]);
    
    $id = $db->lastInsertId();
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('create', 'council_member', $id);
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Council member created successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Council create error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create council member']);
}

