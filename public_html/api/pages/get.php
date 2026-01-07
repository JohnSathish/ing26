<?php
/**
 * Get Single Dynamic Page by Slug
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    $slug = sanitizeInput($_GET['slug'] ?? '', 'string');
    
    if (empty($slug)) {
        http_response_code(400);
        echo json_encode(['error' => 'Slug parameter is required']);
        exit;
    }
    
    // Check if admin (for disabled pages)
    require_once __DIR__ . '/../middleware/auth.php';
    $user = getCurrentUser();
    $isAdmin = $user && $user['role'] === ROLE_ADMIN;
    
    $whereClause = 'slug = :slug AND deleted_at IS NULL';
    if (!$isAdmin) {
        $whereClause .= ' AND is_enabled = 1';
    }
    
    $stmt = $db->prepare("
        SELECT id, title, slug, content, excerpt, meta_title, meta_description, 
               featured_image, menu_label, menu_position, parent_menu, is_submenu, 
               is_enabled, is_featured, show_in_menu, sort_order, created_at, updated_at
        FROM pages
        WHERE $whereClause
        LIMIT 1
    ");
    
    $stmt->execute(['slug' => $slug]);
    $page = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$page) {
        http_response_code(404);
        echo json_encode(['error' => 'Page not found']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $page
    ]);
    
} catch (PDOException $e) {
    error_log("Page get error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch page']);
}

