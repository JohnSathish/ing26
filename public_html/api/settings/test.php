<?php
/**
 * Test endpoint for settings API
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

header('Content-Type: application/json');

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if settings table exists
    $tableCheck = $db->query("SHOW TABLES LIKE 'settings'");
    $tableExists = $tableCheck->rowCount() > 0;
    
    // Get all settings
    $settings = [];
    if ($tableExists) {
        $stmt = $db->query("SELECT key_name, value, type FROM settings LIMIT 5");
        $settings = $stmt->fetchAll();
    }
    
    echo json_encode([
        'success' => true,
        'table_exists' => $tableExists,
        'settings_count' => count($settings),
        'sample_settings' => $settings,
        'database_connected' => true
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}

