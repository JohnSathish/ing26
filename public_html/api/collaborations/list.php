<?php
/**
 * List Collaborations/Partners
 * Public endpoint
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    $stmt = $db->query("
        SELECT id, name, logo, website, description, order_index, created_at
        FROM collaborations
        WHERE is_active = 1
        ORDER BY order_index ASC, name ASC
    ");
    
    $collaborations = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $collaborations
    ]);
    
} catch (PDOException $e) {
    error_log("Collaborations list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch collaborations']);
}

