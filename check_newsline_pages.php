<?php
if (!defined('API_ACCESS')) { define('API_ACCESS', true); }
require_once __DIR__ . '/public_html/api/config/database.php';

$db = Database::getInstance()->getConnection();
$stmt = $db->query("SELECT id, title, slug, parent_menu, is_submenu, is_enabled, show_in_menu, sort_order FROM pages WHERE parent_menu = 'newsline' AND deleted_at IS NULL ORDER BY sort_order ASC");
$pages = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Total NewsLine pages: " . count($pages) . PHP_EOL . PHP_EOL;

foreach($pages as $page) {
    echo sprintf("ID: %d | %s | parent: %s | enabled: %s | submenu: %s | show: %s | order: %d" . PHP_EOL, 
        $page['id'], 
        $page['title'], 
        $page['parent_menu'], 
        $page['is_enabled'] ? 'yes' : 'no',
        $page['is_submenu'] ? 'yes' : 'no', 
        $page['show_in_menu'] ? 'yes' : 'no', 
        $page['sort_order']
    );
}

