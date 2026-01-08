<?php
/**
 * List All Admin Users
 * Returns list of all admin users (admin only)
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/security.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../middleware/auth.php';

// Check authentication
$user = getCurrentUser();
if (!$user || $user['role'] !== ROLE_ADMIN) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Get all users (excluding password hash)
    $stmt = $db->query("
        SELECT id, username, role, created_at, updated_at, 
               failed_attempts, locked_until
        FROM admins
        ORDER BY created_at DESC
    ");
    
    $users = $stmt->fetchAll();
    
    // Format dates and remove sensitive info
    foreach ($users as &$userData) {
        unset($userData['password_hash']);
        if ($userData['locked_until']) {
            $userData['is_locked'] = strtotime($userData['locked_until']) > time();
        } else {
            $userData['is_locked'] = false;
        }
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

