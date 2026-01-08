<?php
/**
 * Update Admin Credentials
 * Allows admin to change username and/or password
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
    
    $newUsername = sanitizeInput($input['username'] ?? '', 'string');
    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $confirmPassword = $input['confirm_password'] ?? '';
    
    // Get current user data
    $stmt = $db->prepare("SELECT id, username, password_hash FROM admins WHERE id = :id");
    $stmt->execute(['id' => $user['id']]);
    $currentUser = $stmt->fetch();
    
    if (!$currentUser) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    $updates = [];
    $params = ['id' => $user['id']];
    
    // Update username if provided
    if (!empty($newUsername) && $newUsername !== $currentUser['username']) {
        // Check if new username already exists
        $checkStmt = $db->prepare("SELECT id FROM admins WHERE username = :username AND id != :id");
        $checkStmt->execute(['username' => $newUsername, 'id' => $user['id']]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Username already exists']);
            exit;
        }
        
        // Validate username
        if (strlen($newUsername) < 3 || strlen($newUsername) > 50) {
            http_response_code(400);
            echo json_encode(['error' => 'Username must be between 3 and 50 characters']);
            exit;
        }
        
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $newUsername)) {
            http_response_code(400);
            echo json_encode(['error' => 'Username can only contain letters, numbers, and underscores']);
            exit;
        }
        
        $updates[] = "username = :username";
        $params['username'] = $newUsername;
    }
    
    // Update password if provided
    if (!empty($newPassword)) {
        // Verify current password
        if (empty($currentPassword)) {
            http_response_code(400);
            echo json_encode(['error' => 'Current password is required to change password']);
            exit;
        }
        
        if (!password_verify($currentPassword, $currentUser['password_hash'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Current password is incorrect']);
            exit;
        }
        
        // Validate new password
        if (strlen($newPassword) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'New password must be at least 8 characters long']);
            exit;
        }
        
        if ($newPassword !== $confirmPassword) {
            http_response_code(400);
            echo json_encode(['error' => 'New password and confirmation do not match']);
            exit;
        }
        
        // Check if new password is same as current
        if (password_verify($newPassword, $currentUser['password_hash'])) {
            http_response_code(400);
            echo json_encode(['error' => 'New password must be different from current password']);
            exit;
        }
        
        $updates[] = "password_hash = :password_hash";
        $params['password_hash'] = password_hash($newPassword, PASSWORD_DEFAULT);
    }
    
    // If no updates requested
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No changes provided']);
        exit;
    }
    
    // Update the user
    $updates[] = "updated_at = NOW()";
    $sql = "UPDATE admins SET " . implode(', ', $updates) . " WHERE id = :id";
    $updateStmt = $db->prepare($sql);
    $updateStmt->execute($params);
    
    // Get updated user data
    $stmt = $db->prepare("SELECT id, username, role FROM admins WHERE id = :id");
    $stmt->execute(['id' => $user['id']]);
    $updatedUser = $stmt->fetch();
    
    // Log the change
    require_once __DIR__ . '/../../config/audit.php';
    logAudit($db, $user['id'], 'admin_credentials_updated', 'Updated admin credentials', [
        'user_id' => $user['id'],
        'username_changed' => !empty($newUsername),
        'password_changed' => !empty($newPassword)
    ]);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Credentials updated successfully',
        'user' => [
            'id' => $updatedUser['id'],
            'username' => $updatedUser['username'],
            'role' => $updatedUser['role']
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

