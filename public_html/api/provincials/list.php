<?php
/**
 * List Provincials
 * Public endpoint
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get query parameters
    $title = sanitizeInput($_GET['title'] ?? null, 'string');
    
    // Build query
    $where = [];
    $params = [];
    
    if ($title !== null && in_array($title, ['provincial', 'vice_provincial', 'economer', 'secretary'])) {
        $where[] = "title = :title";
        $params['title'] = $title;
    }
    
    $whereClause = !empty($where) ? "WHERE " . implode(' AND ', $where) : "";
    
    $sql = "
        SELECT id, name, title, image, bio, period_start, period_end, is_current, order_index, created_at
        FROM provincials
        $whereClause
        ORDER BY is_current DESC, order_index ASC, created_at DESC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $provincials = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $provincials
    ]);
    
} catch (PDOException $e) {
    error_log("Provincials list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch provincials']);
}

