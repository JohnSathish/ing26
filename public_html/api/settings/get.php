<?php
/**
 * Get Settings
 * Public endpoint (some settings may be admin-only)
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get specific key or all settings
    $key = sanitizeInput($_GET['key'] ?? null, 'string');
    
    if ($key) {
        $stmt = $db->prepare("SELECT key_name, value, type FROM settings WHERE key_name = :key");
        $stmt->execute(['key' => $key]);
        $setting = $stmt->fetch();
        
        if (!$setting) {
            // Return success with null value instead of 404 for missing keys
            // This allows frontend to handle missing settings gracefully
            echo json_encode([
                'success' => true,
                'data' => [
                    'key_name' => $key,
                    'value' => null,
                    'type' => 'text'
                ]
            ]);
            exit;
        }
        
        // Return in format expected by frontend (key-value object)
        echo json_encode([
            'success' => true,
            'data' => [
                $setting['key_name'] => $setting['value']
            ]
        ]);
    } else {
        // Get all settings
        $stmt = $db->query("SELECT key_name, value, type FROM settings ORDER BY key_name ASC");
        $settings = $stmt->fetchAll();
        
        // Convert to key-value object
        $settingsObj = [];
        foreach ($settings as $setting) {
            $settingsObj[$setting['key_name']] = $setting['value'];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $settingsObj
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Settings get error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch settings']);
}

