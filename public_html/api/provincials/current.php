<?php
/**
 * Get Current Provincial
 * Public endpoint
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->query("
        SELECT id, name, title, image, bio, period_start, period_end, created_at
        FROM provincials
        WHERE title = 'provincial' AND is_current = 1
        ORDER BY created_at DESC
        LIMIT 1
    ");
    
    $provincial = $stmt->fetch();
    
    if (!$provincial) {
        echo json_encode([
            'success' => true,
            'data' => null
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $provincial
    ]);
    
} catch (PDOException $e) {
    error_log("Provincials current error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch current provincial']);
}

