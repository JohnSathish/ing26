<?php
if (!defined('API_ACCESS')) { define('API_ACCESS', true); }
require_once __DIR__ . '/public_html/api/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    echo "=== Checking All Pages (including deleted) ===\n\n";
    
    // Get ALL pages including deleted
    $stmt = $db->query("
        SELECT id, title, slug, is_enabled, show_in_menu, created_at, updated_at, deleted_at
        FROM pages
        ORDER BY created_at DESC
    ");
    $allPages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Total pages in database (including deleted): " . count($allPages) . "\n\n";
    
    if (count($allPages) > 0) {
        foreach ($allPages as $page) {
            echo "ID: {$page['id']}\n";
            echo "Title: {$page['title']}\n";
            echo "Slug: {$page['slug']}\n";
            echo "Enabled: " . ($page['is_enabled'] ? 'YES' : 'NO') . "\n";
            echo "Show in Menu: " . ($page['show_in_menu'] ? 'YES' : 'NO') . "\n";
            echo "Created: {$page['created_at']}\n";
            echo "Deleted: " . ($page['deleted_at'] ? $page['deleted_at'] : 'NO') . "\n";
            echo "---\n";
        }
    } else {
        echo "No pages found in database at all!\n";
        echo "\nLet's check the table structure:\n";
        $descStmt = $db->query("DESCRIBE pages");
        $columns = $descStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $col) {
            echo "  - {$col['Field']} ({$col['Type']})\n";
        }
    }
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
}

