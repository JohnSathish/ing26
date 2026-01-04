<?php
/**
 * Update Birthday Wish
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

// Get ID from URL or input
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
$dateOfBirth = $input['date_of_birth'] ?? null;
$message = sanitizeInput($input['message'] ?? null, 'string');
$backgroundColor = sanitizeInput($input['background_color'] ?? null, 'string');
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : null;
$profileImage = sanitizeInput($input['profile_image'] ?? null, 'string');

// Build update query dynamically
$updates = [];
$params = ['id' => $id];

if ($name !== null) {
    $updates[] = "name = :name";
    $params['name'] = $name;
}

if ($dateOfBirth !== null) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateOfBirth)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date format']);
        exit;
    }
    $updates[] = "date_of_birth = :date_of_birth";
    $params['date_of_birth'] = $dateOfBirth;
}

if ($message !== null) {
    $updates[] = "message = :message";
    $params['message'] = $message;
}

if ($backgroundColor !== null) {
    if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $backgroundColor)) {
        $backgroundColor = '#6B46C1';
    }
    $updates[] = "background_color = :background_color";
    $params['background_color'] = $backgroundColor;
}

if ($isActive !== null) {
    $updates[] = "is_active = :is_active";
    $params['is_active'] = $isActive ? 1 : 0;
}

if ($profileImage !== null) {
    $updates[] = "profile_image = :profile_image";
    $params['profile_image'] = $profileImage;
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['error' => 'No fields to update']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $sql = "UPDATE birthday_wishes SET " . implode(', ', $updates) . " WHERE id = :id AND deleted_at IS NULL";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Birthday wish not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('update', 'birthday_wish', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Birthday wish updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Birthday update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update birthday wish']);
}


