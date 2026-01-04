<?php
/**
 * List NewsLine Issues
 * Public endpoint - returns active NewsLine issues with archive structure
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get query parameters
    $year = isset($_GET['year']) ? intval($_GET['year']) : null;
    $month = isset($_GET['month']) ? intval($_GET['month']) : null;
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(MAX_PAGE_SIZE, max(1, intval($_GET['limit'] ?? DEFAULT_PAGE_SIZE)));
    $offset = ($page - 1) * $limit;
    
    // Check if admin (for inactive items)
    require_once __DIR__ . '/../middleware/auth.php';
    $user = getCurrentUser();
    $isAdmin = $user && $user['role'] === ROLE_ADMIN;
    
    // Build query
    $where = ["deleted_at IS NULL"];
    $params = [];
    
    if (!$isAdmin) {
        $where[] = "is_active = 1";
    }
    
    if ($year !== null) {
        $where[] = "year = :year";
        $params['year'] = $year;
    }
    
    if ($month !== null && $month >= 1 && $month <= 12) {
        $where[] = "month = :month";
        $params['month'] = $month;
    }
    
    $whereClause = implode(' AND ', $where);
    
    $sql = "
        SELECT id, title, month, year, cover_image, pdf_path, qr_code_url, description, is_active, created_at
        FROM newsline
        WHERE $whereClause
        ORDER BY year DESC, month DESC
        LIMIT :limit OFFSET :offset
    ";
    
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $issues = $stmt->fetchAll();
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM newsline WHERE $whereClause";
    $countStmt = $db->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetch()['total'];
    
    // Get archive structure
    $archiveStmt = $db->query("
        SELECT year, month, COUNT(*) as count
        FROM newsline
        WHERE deleted_at IS NULL AND is_active = 1
        GROUP BY year, month
        ORDER BY year DESC, month DESC
    ");
    $archive = $archiveStmt->fetchAll();
    
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
        'data' => $issues,
        'archive' => $archiveByYear,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => intval($total),
            'pages' => ceil($total / $limit)
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("NewsLine list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch NewsLine issues']);
}

