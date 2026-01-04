<?php
/**
 * List Houses
 * Public endpoint - returns active houses
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
    
    // Build query
    if ($isAdmin) {
        $stmt = $db->query("
            SELECT id, name, description, location, image, order_index, is_active, created_at
            FROM houses
            WHERE deleted_at IS NULL
            ORDER BY order_index ASC, name ASC
        ");
    } else {
        $stmt = $db->query("
            SELECT id, name, description, location, image, order_index, created_at
            FROM houses
            WHERE is_active = 1 AND deleted_at IS NULL
            ORDER BY order_index ASC, name ASC
        ");
    }
    
    $houses = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $houses
    ]);
    
} catch (PDOException $e) {
    error_log("Houses list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch houses']);
}


