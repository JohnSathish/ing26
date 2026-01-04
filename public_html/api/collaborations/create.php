<?php
/**
 * Create Collaboration
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
$logo = sanitizeInput($input['logo'] ?? '', 'string');
$website = sanitizeInput($input['website'] ?? null, 'url');
$description = sanitizeInput($input['description'] ?? '', 'string');
$orderIndex = isset($input['order_index']) ? intval($input['order_index']) : 0;
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : true;

// Validation
if (empty($name) || empty($logo)) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and logo are required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        INSERT INTO collaborations (name, logo, website, description, order_index, is_active)
        VALUES (:name, :logo, :website, :description, :order_index, :is_active)
    ");
    
    $stmt->execute([
        'name' => $name,
        'logo' => $logo,
        'website' => $website,
        'description' => $description,
        'order_index' => $orderIndex,
        'is_active' => $isActive ? 1 : 0
    ]);
    
    $id = $db->lastInsertId();
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('create', 'collaboration', $id);
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Collaboration created successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Collaboration create error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create collaboration']);
}

