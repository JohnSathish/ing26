<?php
/**
 * Create Admin User
 * Run this once via browser to create an admin user
 * DELETE THIS FILE after creating admin user for security!
 * 
 * Usage: https://yourdomain.com/api/setup/create_admin.php?username=admin&password=YourSecurePassword
 */

// Security: Only allow this in development or with proper authentication
// For production, comment out the exit and add proper authentication
if (!isset($_GET['create_admin_token']) || $_GET['create_admin_token'] !== 'YOUR_SECRET_TOKEN_HERE') {
    http_response_code(403);
    exit('Access denied. Use proper authentication token.');
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

// Get parameters
$username = $_GET['username'] ?? 'admin';
$password = $_GET['password'] ?? '';

if (empty($password)) {
    echo json_encode([
        'success' => false,
        'error' => 'Password is required'
    ]);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if user already exists
    $checkStmt = $db->prepare("SELECT id FROM admins WHERE username = :username");
    $checkStmt->execute(['username' => $username]);
    
    if ($checkStmt->fetch()) {
        echo json_encode([
            'success' => false,
            'error' => 'Username already exists'
        ]);
        exit;
    }
    
    // Hash password
    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    
    // Insert admin user
    $stmt = $db->prepare("
        INSERT INTO admins (username, password_hash, role, created_at) 
        VALUES (:username, :password_hash, 'admin', NOW())
    ");
    
    $stmt->execute([
        'username' => $username,
        'password_hash' => $passwordHash
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Admin user created successfully',
        'username' => $username,
        'note' => 'DELETE THIS FILE NOW FOR SECURITY!'
    ]);
    
} catch (PDOException $e) {
    error_log("Create admin error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to create admin user: ' . $e->getMessage()
    ]);
}

