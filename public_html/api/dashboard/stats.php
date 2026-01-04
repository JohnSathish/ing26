<?php
/**
 * Dashboard Statistics Endpoint
 * Returns statistics for admin dashboard
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/auth.php';

// Require authentication
requireAdmin();

try {
    $db = Database::getInstance()->getConnection();
    
    // Get statistics
    $stats = [];
    
    // Birthday wishes count
    $stmt = $db->query("SELECT COUNT(*) as count FROM birthday_wishes WHERE deleted_at IS NULL");
    $stats['birthday_wishes'] = $stmt->fetch()['count'];
    
    // News count
    $stmt = $db->query("SELECT COUNT(*) as count FROM news WHERE deleted_at IS NULL");
    $stats['news'] = $stmt->fetch()['count'];
    
    // Published news count
    $stmt = $db->query("SELECT COUNT(*) as count FROM news WHERE is_published = 1 AND deleted_at IS NULL");
    $stats['published_news'] = $stmt->fetch()['count'];
    
    // Houses count
    $stmt = $db->query("SELECT COUNT(*) as count FROM houses WHERE deleted_at IS NULL");
    $stats['houses'] = $stmt->fetch()['count'];
    
    // Active banners count
    $stmt = $db->query("SELECT COUNT(*) as count FROM banners WHERE is_active = 1");
    $stats['banners'] = $stmt->fetch()['count'];
    
    // Recent activity (last 7 days)
    $stmt = $db->query("
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ");
    $stats['recent_activity'] = $stmt->fetch()['count'];
    
    echo json_encode(['success' => true, 'stats' => $stats]);
    
} catch (PDOException $e) {
    error_log("Dashboard stats error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch statistics']);
}


