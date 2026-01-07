<?php
/**
 * Create Dynamic Page
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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $title = sanitizeInput($input['title'] ?? '', 'string');
    $slug = sanitizeInput($input['slug'] ?? '', 'string');
    $content = $input['content'] ?? '';
    $excerpt = sanitizeInput($input['excerpt'] ?? '', 'string');
    $metaTitle = sanitizeInput($input['meta_title'] ?? '', 'string');
    $metaDescription = sanitizeInput($input['meta_description'] ?? '', 'string');
    $featuredImage = sanitizeInput($input['featured_image'] ?? '', 'string');
    $menuLabel = sanitizeInput($input['menu_label'] ?? '', 'string');
    $menuPosition = intval($input['menu_position'] ?? 0);
    $parentMenu = sanitizeInput($input['parent_menu'] ?? '', 'string');
    $isSubmenu = isset($input['is_submenu']) ? (bool)$input['is_submenu'] : false;
    $isEnabled = isset($input['is_enabled']) ? (bool)$input['is_enabled'] : true;
    $isFeatured = isset($input['is_featured']) ? (bool)$input['is_featured'] : false;
    $showInMenu = isset($input['show_in_menu']) ? (bool)$input['show_in_menu'] : true;
    $sortOrder = intval($input['sort_order'] ?? 0);
    
    // Validate required fields
    if (empty($title) || empty($slug)) {
        http_response_code(400);
        echo json_encode(['error' => 'Title and slug are required']);
        exit;
    }
    
    // Generate slug from title if not provided
    if (empty($slug)) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
    }
    
    // Check if slug already exists
    $checkStmt = $db->prepare("SELECT id FROM pages WHERE slug = :slug AND deleted_at IS NULL");
    $checkStmt->execute(['slug' => $slug]);
    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'A page with this slug already exists']);
        exit;
    }
    
    // Insert page
    $stmt = $db->prepare("
        INSERT INTO pages (
            title, slug, content, excerpt, meta_title, meta_description,
            featured_image, menu_label, menu_position, parent_menu, is_submenu,
            is_enabled, is_featured, show_in_menu, sort_order
        ) VALUES (
            :title, :slug, :content, :excerpt, :meta_title, :meta_description,
            :featured_image, :menu_label, :menu_position, :parent_menu, :is_submenu,
            :is_enabled, :is_featured, :show_in_menu, :sort_order
        )
    ");
    
    $stmt->execute([
        'title' => $title,
        'slug' => $slug,
        'content' => $content,
        'excerpt' => $excerpt,
        'meta_title' => $metaTitle ?: $title,
        'meta_description' => $metaDescription,
        'featured_image' => $featuredImage ?: null,
        'menu_label' => $menuLabel ?: $title,
        'menu_position' => $menuPosition,
        'parent_menu' => $parentMenu ?: null,
        'is_submenu' => $isSubmenu ? 1 : 0,
        'is_enabled' => $isEnabled ? 1 : 0,
        'is_featured' => $isFeatured ? 1 : 0,
        'show_in_menu' => $showInMenu ? 1 : 0,
        'sort_order' => $sortOrder
    ]);
    
    $id = $db->lastInsertId();
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('create', 'page', $id);
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Page created successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Page create error: " . $e->getMessage());
    http_response_code(500);
    if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
        echo json_encode([
            'error' => 'Failed to create page',
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    } else {
        echo json_encode(['error' => 'Failed to create page']);
    }
} catch (Exception $e) {
    error_log("Page create error: " . $e->getMessage());
    http_response_code(500);
    if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
        echo json_encode([
            'error' => 'Failed to create page',
            'message' => $e->getMessage()
        ]);
    } else {
        echo json_encode(['error' => 'Failed to create page']);
    }
}

