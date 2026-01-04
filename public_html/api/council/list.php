<?php
/**
 * List Council Members
 * Public endpoint
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get query parameters
    $dimension = sanitizeInput($_GET['dimension'] ?? null, 'string');
    $commission = sanitizeInput($_GET['commission'] ?? null, 'string');
    
    // Build query
    $where = ["is_active = 1"];
    $params = [];
    
    if ($dimension !== null) {
        $where[] = "dimension = :dimension";
        $params['dimension'] = $dimension;
    }
    
    if ($commission !== null) {
        $where[] = "commission = :commission";
        $params['commission'] = $commission;
    }
    
    $whereClause = implode(' AND ', $where);
    
    $sql = "
        SELECT id, name, role, image, bio, dimension, commission, order_index, created_at
        FROM council_members
        WHERE $whereClause
        ORDER BY order_index ASC, name ASC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $members = $stmt->fetchAll();
    
    // Get dimensions
    $dimensionsStmt = $db->query("
        SELECT DISTINCT dimension, COUNT(*) as count
        FROM council_members
        WHERE is_active = 1 AND dimension IS NOT NULL AND dimension != ''
        GROUP BY dimension
        ORDER BY dimension ASC
    ");
    $dimensions = $dimensionsStmt->fetchAll();
    
    // Get commissions
    $commissionsStmt = $db->query("
        SELECT DISTINCT commission, COUNT(*) as count
        FROM council_members
        WHERE is_active = 1 AND commission IS NOT NULL AND commission != ''
        GROUP BY commission
        ORDER BY commission ASC
    ");
    $commissions = $commissionsStmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $members,
        'dimensions' => $dimensions,
        'commissions' => $commissions
    ]);
    
} catch (PDOException $e) {
    error_log("Council list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch council members']);
}

