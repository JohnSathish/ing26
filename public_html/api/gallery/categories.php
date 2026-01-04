<?php
/**
 * Get Gallery Categories
 * Public endpoint
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->query("
        SELECT DISTINCT category, COUNT(*) as count
        FROM gallery
        WHERE deleted_at IS NULL AND category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY category ASC
    ");
    
    $categories = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $categories
    ]);
    
} catch (PDOException $e) {
    error_log("Gallery categories error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch categories']);
}

