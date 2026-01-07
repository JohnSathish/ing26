<?php
if (!defined('API_ACCESS')) { define('API_ACCESS', true); }
require_once __DIR__ . '/public_html/api/config/database.php';

$db = Database::getInstance()->getConnection();

// Get menu items (same query as in pages/list.php)
$menuStmt = $db->prepare("
    SELECT id, title, slug, menu_label, parent_menu, is_submenu, sort_order
    FROM pages
    WHERE deleted_at IS NULL AND is_enabled = 1 AND show_in_menu = 1 AND parent_menu = 'newsline'
    ORDER BY parent_menu ASC, sort_order ASC, menu_position ASC
");
$menuStmt->execute();
$menuItems = $menuStmt->fetchAll(PDO::FETCH_ASSOC);

echo "Total NewsLine menu items from API query: " . count($menuItems) . PHP_EOL . PHP_EOL;

foreach($menuItems as $item) {
    echo sprintf("ID: %d | %s | slug: %s | order: %d" . PHP_EOL, 
        $item['id'], 
        $item['menu_label'] ?: $item['title'],
        $item['slug'],
        $item['sort_order']
    );
}

