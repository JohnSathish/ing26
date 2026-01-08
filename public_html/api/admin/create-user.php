<?php
/**
 * Create New Admin User
 * Allows admin to create new admin users
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/security.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/csrf.php';

// Check authentication
$user = getCurrentUser();
if (!$user || $user['role'] !== ROLE_ADMIN) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Check CSRF token
validateCSRF();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $username = sanitizeInput($input['username'] ?? '', 'string');
    $password = $input['password'] ?? '';
    $confirmPassword = $input['confirm_password'] ?? '';
    $role = sanitizeInput($input['role'] ?? 'admin', 'string');
    
    // Validate inputs
    if (empty($username)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username is required']);
        exit;
    }
    
    if (empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Password is required']);
        exit;
    }
    
    // Validate username
    if (strlen($username) < 3 || strlen($username) > 50) {
        http_response_code(400);
        echo json_encode(['error' => 'Username must be between 3 and 50 characters']);
        exit;
    }
    
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username can only contain letters, numbers, and underscores']);
        exit;
    }
    
    // Validate password
    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters long']);
        exit;
    }
    
    if ($password !== $confirmPassword) {
        http_response_code(400);
        echo json_encode(['error' => 'Password and confirmation do not match']);
        exit;
    }
    
    // Validate role
    if (!in_array($role, ['admin', 'editor'])) {
        $role = 'admin'; // Default to admin
    }
    
    // Check if username already exists
    $checkStmt = $db->prepare("SELECT id FROM admins WHERE username = :username");
    $checkStmt->execute(['username' => $username]);
    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Username already exists']);
        exit;
    }
    
    // Create new user
    $stmt = $db->prepare("
        INSERT INTO admins (username, password_hash, role, created_at, updated_at)
        VALUES (:username, :password_hash, :role, NOW(), NOW())
    ");
    
    $stmt->execute([
        'username' => $username,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'role' => $role
    ]);
    
    $newUserId = $db->lastInsertId();
    
    // Get created user data
    $stmt = $db->prepare("SELECT id, username, role, created_at FROM admins WHERE id = :id");
    $stmt->execute(['id' => $newUserId]);
    $newUser = $stmt->fetch();
    
    // Log the creation
    require_once __DIR__ . '/../../config/audit.php';
    logAudit($db, $user['id'], 'admin_user_created', 'Created new admin user', [
        'created_user_id' => $newUserId,
        'created_username' => $username,
        'created_role' => $role
    ]);
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'User created successfully',
        'user' => [
            'id' => $newUser['id'],
            'username' => $newUser['username'],
            'role' => $newUser['role'],
            'created_at' => $newUser['created_at']
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

