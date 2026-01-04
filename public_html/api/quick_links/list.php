<?php
/**
 * List Quick Links
 * Public endpoint
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->query("
        SELECT id, title, url, icon, order_index, created_at
        FROM quick_links
        WHERE is_active = 1
        ORDER BY order_index ASC, title ASC
    ");
    
    $links = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $links
    ]);
    
} catch (PDOException $e) {
    error_log("Quick links list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch quick links']);
}

