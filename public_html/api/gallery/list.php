<?php
/**
 * List Gallery Items
 * Public endpoint
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get query parameters
    $type = sanitizeInput($_GET['type'] ?? null, 'string');
    $category = sanitizeInput($_GET['category'] ?? null, 'string');
    $featured = isset($_GET['featured']) ? (bool)$_GET['featured'] : null;
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
        // Public users see all active items
    }
    
    if ($type !== null && in_array($type, ['photo', 'video'])) {
        $where[] = "type = :type";
        $params['type'] = $type;
    }
    
    if ($category !== null) {
        $where[] = "category = :category";
        $params['category'] = $category;
    }
    
    if ($featured !== null) {
        $where[] = "is_featured = :featured";
        $params['featured'] = $featured ? 1 : 0;
    }
    
    $whereClause = implode(' AND ', $where);
    
    $sql = "
        SELECT id, title, type, file_path, thumbnail, description, category, is_featured, order_index, created_at
        FROM gallery
        WHERE $whereClause
        ORDER BY is_featured DESC, order_index ASC, created_at DESC
        LIMIT :limit OFFSET :offset
    ";
    
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $items = $stmt->fetchAll();
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM gallery WHERE $whereClause";
    $countStmt = $db->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetch()['total'];
    
    // Get categories
    $categoriesStmt = $db->query("
        SELECT DISTINCT category, COUNT(*) as count
        FROM gallery
        WHERE deleted_at IS NULL AND category IS NOT NULL
        GROUP BY category
        ORDER BY category ASC
    ");
    $categories = $categoriesStmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $items,
        'categories' => $categories,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => intval($total),
            'pages' => ceil($total / $limit)
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Gallery list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch gallery items']);
}

