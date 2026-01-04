<?php
/**
 * List Birthday Wishes
 * Public endpoint - returns active birthday wishes
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
    
    // Check if admin (for deleted items)
    require_once __DIR__ . '/../middleware/auth.php';
    $user = getCurrentUser();
    $isAdmin = $user && $user['role'] === ROLE_ADMIN;
    
    // Build query
    if ($isAdmin) {
        $stmt = $db->prepare("
            SELECT id, name, date_of_birth, message, profile_image, background_color, is_active, created_at
            FROM birthday_wishes
            WHERE deleted_at IS NULL
            ORDER BY date_of_birth ASC, created_at DESC
            LIMIT :limit OFFSET :offset
        ");
    } else {
        $stmt = $db->prepare("
            SELECT id, name, date_of_birth, message, profile_image, background_color, created_at
            FROM birthday_wishes
            WHERE is_active = 1 AND deleted_at IS NULL
            ORDER BY date_of_birth ASC, created_at DESC
            LIMIT :limit OFFSET :offset
        ");
    }
    
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $wishes = $stmt->fetchAll();
    
    // Get total count
    if ($isAdmin) {
        $countStmt = $db->query("SELECT COUNT(*) as total FROM birthday_wishes WHERE deleted_at IS NULL");
    } else {
        $countStmt = $db->query("SELECT COUNT(*) as total FROM birthday_wishes WHERE is_active = 1 AND deleted_at IS NULL");
    }
    $total = $countStmt->fetch()['total'];
    
    echo json_encode([
        'success' => true,
        'data' => $wishes,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => intval($total),
            'pages' => ceil($total / $limit)
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Birthday list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch birthday wishes']);
}


