<?php
/**
 * List News
 * Public endpoint - returns published news
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get query parameters
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(MAX_PAGE_SIZE, max(1, intval($_GET['limit'] ?? DEFAULT_PAGE_SIZE)));
    $offset = ($page - 1) * $limit;
    $featured = isset($_GET['featured']) ? (bool)$_GET['featured'] : null;
    
    // Check if admin (for unpublished items)
    require_once __DIR__ . '/../middleware/auth.php';
    $user = getCurrentUser();
    $isAdmin = $user && $user['role'] === ROLE_ADMIN;
    
    // Build query
    $where = ["deleted_at IS NULL"];
    $params = [];
    
    if (!$isAdmin) {
        $where[] = "is_published = 1";
        $where[] = "published_at <= NOW()";
    }
    
    if ($featured !== null) {
        $where[] = "is_featured = :featured";
        $params['featured'] = $featured ? 1 : 0;
    }
    
    $whereClause = implode(' AND ', $where);
    
    // Check if event_date column exists (for backward compatibility)
    $columnCheck = $db->query("SHOW COLUMNS FROM news LIKE 'event_date'");
    $hasEventDate = $columnCheck && $columnCheck->rowCount() > 0;
    
    // Build SELECT columns
    $selectColumns = "id, title, slug, content, excerpt, featured_image, is_featured, is_published, published_at, created_at";
    if ($hasEventDate) {
        $selectColumns = "id, title, slug, content, excerpt, featured_image, event_date, is_featured, is_published, published_at, created_at";
    }
    
    $sql = "
        SELECT $selectColumns
        FROM news
        WHERE $whereClause
        ORDER BY published_at DESC, created_at DESC
        LIMIT :limit OFFSET :offset
    ";
    
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $news = $stmt->fetchAll();
    
    // Format event_date for each news item (ensure YYYY-MM-DD format)
    foreach ($news as &$item) {
        if (isset($item['event_date']) && $item['event_date']) {
            // If date includes time, extract just the date part
            $dateParts = explode(' ', $item['event_date']);
            $item['event_date'] = $dateParts[0]; // Get YYYY-MM-DD part
        } else {
            $item['event_date'] = null;
        }
    }
    unset($item); // Break reference
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM news WHERE $whereClause";
    $countStmt = $db->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetch()['total'];
    
    echo json_encode([
        'success' => true,
        'data' => $news,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => intval($total),
            'pages' => ceil($total / $limit)
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("News list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch news']);
}


