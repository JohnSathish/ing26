<?php
/**
 * Create Birthday Wish
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
$dateOfBirth = $input['date_of_birth'] ?? '';
$message = sanitizeInput($input['message'] ?? '', 'string');
$profileImage = sanitizeInput($input['profile_image'] ?? '', 'string');
$backgroundColor = sanitizeInput($input['background_color'] ?? '#6B46C1', 'string');
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : true;

// Validation
if (empty($name) || empty($dateOfBirth)) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and date of birth are required']);
    exit;
}

// Validate date
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateOfBirth)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid date format']);
    exit;
}

// Validate color
if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $backgroundColor)) {
    $backgroundColor = '#6B46C1';
}

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->prepare("
        INSERT INTO birthday_wishes (name, date_of_birth, message, profile_image, background_color, is_active)
        VALUES (:name, :date_of_birth, :message, :profile_image, :background_color, :is_active)
    ");
    
    $stmt->execute([
        'name' => $name,
        'date_of_birth' => $dateOfBirth,
        'message' => $message,
        'profile_image' => !empty($profileImage) ? $profileImage : null,
        'background_color' => $backgroundColor,
        'is_active' => $isActive ? 1 : 0
    ]);
    
    $id = $db->lastInsertId();
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('create', 'birthday_wish', $id);
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Birthday wish created successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Birthday create error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create birthday wish']);
}


