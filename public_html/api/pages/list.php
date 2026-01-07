<?php
/**
 * List Dynamic Pages
 * Returns all enabled pages for public, all pages for admin
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
    $enabledOnly = isset($_GET['enabled_only']) 
        ? ($_GET['enabled_only'] === 'true' || $_GET['enabled_only'] === '1' || filter_var($_GET['enabled_only'], FILTER_VALIDATE_BOOLEAN)) 
        : true;
    
    // Check if admin (for all pages including disabled)
    require_once __DIR__ . '/../middleware/auth.php';
    $user = getCurrentUser();
    $isAdmin = $user && $user['role'] === ROLE_ADMIN;
    
    // Build query
    $whereConditions = ['deleted_at IS NULL'];
    if (!$isAdmin && $enabledOnly) {
        $whereConditions[] = 'is_enabled = 1';
    }
    
    $whereClause = implode(' AND ', $whereConditions);
    
    $stmt = $db->prepare("
        SELECT id, title, slug, content, excerpt, meta_title, meta_description, 
               featured_image, menu_label, menu_position, parent_menu, is_submenu, 
               is_enabled, is_featured, show_in_menu, sort_order, created_at, updated_at
        FROM pages
        WHERE $whereClause
        ORDER BY sort_order ASC, menu_position ASC, created_at DESC
        LIMIT :limit OFFSET :offset
    ");
    
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count
    $countStmt = $db->prepare("SELECT COUNT(*) as total FROM pages WHERE $whereClause");
    $countStmt->execute();
    $total = $countStmt->fetch()['total'];
    
    // Get menu items (enabled pages that should show in menu)
    $menuStmt = $db->prepare("
        SELECT id, title, slug, menu_label, parent_menu, is_submenu, sort_order
        FROM pages
        WHERE deleted_at IS NULL AND is_enabled = 1 AND show_in_menu = 1
        ORDER BY parent_menu ASC, sort_order ASC, menu_position ASC
    ");
    $menuStmt->execute();
    $menuItems = $menuStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $pages,
        'menu_items' => $menuItems,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Pages list error: " . $e->getMessage());
    http_response_code(500);
    if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
        echo json_encode([
            'error' => 'Failed to fetch pages',
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    } else {
        echo json_encode(['error' => 'Failed to fetch pages']);
    }
} catch (Exception $e) {
    error_log("Pages list error: " . $e->getMessage());
    http_response_code(500);
    if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
        echo json_encode([
            'error' => 'Failed to fetch pages',
            'message' => $e->getMessage()
        ]);
    } else {
        echo json_encode(['error' => 'Failed to fetch pages']);
    }
}

