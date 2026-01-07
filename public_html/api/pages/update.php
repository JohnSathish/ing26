<?php
/**
 * Update Dynamic Page
 * Admin only
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/auth.php';

// Check authentication
$user = getCurrentUser();
if (!$user || $user['role'] !== ROLE_ADMIN) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Check CSRF token
require_once __DIR__ . '/../middleware/csrf.php';
validateCSRF();

try {
    $db = Database::getInstance()->getConnection();
    
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid page ID']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Build update query dynamically
    $updates = [];
    $params = ['id' => $id];
    
    if (isset($input['title'])) {
        $updates[] = 'title = :title';
        $params['title'] = sanitizeInput($input['title'], 'string');
    }
    
    if (isset($input['slug'])) {
        $slug = sanitizeInput($input['slug'], 'string');
        // Check if slug already exists (excluding current page)
        $checkStmt = $db->prepare("SELECT id FROM pages WHERE slug = :slug AND id != :id AND deleted_at IS NULL");
        $checkStmt->execute(['slug' => $slug, 'id' => $id]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'A page with this slug already exists']);
            exit;
        }
        $updates[] = 'slug = :slug';
        $params['slug'] = $slug;
    }
    
    if (isset($input['content'])) {
        $updates[] = 'content = :content';
        $params['content'] = $input['content'];
    }
    
    if (isset($input['excerpt'])) {
        $updates[] = 'excerpt = :excerpt';
        $params['excerpt'] = sanitizeInput($input['excerpt'], 'string');
    }
    
    if (isset($input['meta_title'])) {
        $updates[] = 'meta_title = :meta_title';
        $params['meta_title'] = sanitizeInput($input['meta_title'], 'string');
    }
    
    if (isset($input['meta_description'])) {
        $updates[] = 'meta_description = :meta_description';
        $params['meta_description'] = sanitizeInput($input['meta_description'], 'string');
    }
    
    if (isset($input['featured_image'])) {
        $updates[] = 'featured_image = :featured_image';
        $params['featured_image'] = sanitizeInput($input['featured_image'], 'string') ?: null;
    }
    
    if (isset($input['menu_label'])) {
        $updates[] = 'menu_label = :menu_label';
        $params['menu_label'] = sanitizeInput($input['menu_label'], 'string');
    }
    
    if (isset($input['menu_position'])) {
        $updates[] = 'menu_position = :menu_position';
        $params['menu_position'] = intval($input['menu_position']);
    }
    
    if (isset($input['parent_menu'])) {
        $updates[] = 'parent_menu = :parent_menu';
        $params['parent_menu'] = sanitizeInput($input['parent_menu'], 'string') ?: null;
    }
    
    if (isset($input['is_submenu'])) {
        $updates[] = 'is_submenu = :is_submenu';
        $params['is_submenu'] = (bool)$input['is_submenu'] ? 1 : 0;
    }
    
    if (isset($input['is_enabled'])) {
        $updates[] = 'is_enabled = :is_enabled';
        $params['is_enabled'] = (bool)$input['is_enabled'] ? 1 : 0;
    }
    
    if (isset($input['is_featured'])) {
        $updates[] = 'is_featured = :is_featured';
        $params['is_featured'] = (bool)$input['is_featured'] ? 1 : 0;
    }
    
    if (isset($input['show_in_menu'])) {
        $updates[] = 'show_in_menu = :show_in_menu';
        $params['show_in_menu'] = (bool)$input['show_in_menu'] ? 1 : 0;
    }
    
    if (isset($input['sort_order'])) {
        $updates[] = 'sort_order = :sort_order';
        $params['sort_order'] = intval($input['sort_order']);
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }
    
    $sql = "UPDATE pages SET " . implode(', ', $updates) . " WHERE id = :id AND deleted_at IS NULL";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Page not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('update', 'page', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Page updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Page update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update page']);
}

