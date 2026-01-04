<?php
/**
 * List Banners
 * Public endpoint - returns active banners
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get query parameters
    $type = sanitizeInput($_GET['type'] ?? null, 'string');
    
    // Check if admin (for inactive items)
    require_once __DIR__ . '/../middleware/auth.php';
    $user = getCurrentUser();
    $isAdmin = $user && $user['role'] === ROLE_ADMIN;
    
    // Build query
    $where = [];
    $params = [];
    
    if (!$isAdmin) {
        $where[] = "is_active = 1";
    }
    
    if ($type !== null && in_array($type, ['hero', 'flash_news'])) {
        $where[] = "type = :type";
        $params['type'] = $type;
    }
    
    $whereClause = !empty($where) ? "WHERE " . implode(' AND ', $where) : "";
    
    $sql = "
        SELECT id, type, title, subtitle, content, image, link_url, is_active, order_index, created_at
        FROM banners
        $whereClause
        ORDER BY order_index ASC, created_at DESC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $banners = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $banners
    ]);
    
} catch (PDOException $e) {
    error_log("Banners list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch banners']);
}


