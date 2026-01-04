<?php
/**
 * Get Current/Latest NewsLine Issue
 * Public endpoint
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->query("
        SELECT id, title, month, year, cover_image, pdf_path, qr_code_url, description, created_at
        FROM newsline
        WHERE deleted_at IS NULL AND is_active = 1
        ORDER BY year DESC, month DESC
        LIMIT 1
    ");
    
    $issue = $stmt->fetch();
    
    if (!$issue) {
        echo json_encode([
            'success' => true,
            'data' => null
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $issue
    ]);
    
} catch (PDOException $e) {
    error_log("NewsLine current error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch current issue']);
}

