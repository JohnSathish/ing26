<?php
/**
 * Get Circulars Archive Structure
 * Public endpoint - returns organized archive by year/month
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get archive structure
    $stmt = $db->query("
        SELECT year, month, COUNT(*) as count
        FROM circulars
        WHERE deleted_at IS NULL AND is_active = 1
        GROUP BY year, month
        ORDER BY year DESC, month DESC
    ");
    $archive = $stmt->fetchAll();
    
    // Organize archive by year
    $archiveByYear = [];
    foreach ($archive as $item) {
        if (!isset($archiveByYear[$item['year']])) {
            $archiveByYear[$item['year']] = [];
        }
        $archiveByYear[$item['year']][] = [
            'month' => intval($item['month']),
            'count' => intval($item['count'])
        ];
    }
    
    echo json_encode([
        'success' => true,
        'archive' => $archiveByYear
    ]);
    
} catch (PDOException $e) {
    error_log("Circulars archive error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch archive']);
}

