<?php
/**
 * List Messages (Provincial Messages)
 * Public endpoint - returns active message
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if admin (for inactive items)
    require_once __DIR__ . '/../middleware/auth.php';
    $user = getCurrentUser();
    $isAdmin = $user && $user['role'] === ROLE_ADMIN;
    
    // Get active message (or all if admin)
    if ($isAdmin) {
        $stmt = $db->query("
            SELECT id, title, content, author_name, author_title, author_image, is_active, created_at, updated_at
            FROM messages
            ORDER BY is_active DESC, created_at DESC
            LIMIT 1
        ");
    } else {
        $stmt = $db->prepare("
            SELECT id, title, content, author_name, author_title, author_image, created_at
            FROM messages
            WHERE is_active = 1
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute();
    }
    
    $message = $stmt->fetch();
    
    if (!$message) {
        echo json_encode([
            'success' => true,
            'data' => null
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $message
    ]);
    
} catch (PDOException $e) {
    error_log("Messages list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch message']);
}


