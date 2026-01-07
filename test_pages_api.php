<?php
/**
 * Test Pages API
 * Check if pages exist and API is working
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }
require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if pages table exists
    $stmt = $db->query("SHOW TABLES LIKE 'pages'");
    $tableExists = $stmt->rowCount() > 0;
    
    echo "=== Pages API Test ===\n\n";
    echo "1. Pages table exists: " . ($tableExists ? "✅ YES" : "❌ NO") . "\n\n";
    
    if ($tableExists) {
        // Count all pages
        $countStmt = $db->query("SELECT COUNT(*) as total FROM pages WHERE deleted_at IS NULL");
        $total = $countStmt->fetch()['total'];
        echo "2. Total pages (not deleted): {$total}\n\n";
        
        // Get all pages
        $pagesStmt = $db->query("
            SELECT id, title, slug, is_enabled, show_in_menu, created_at, deleted_at
            FROM pages
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
        ");
        $pages = $pagesStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "3. Pages list:\n";
        if (count($pages) > 0) {
            foreach ($pages as $page) {
                echo "   - ID: {$page['id']}\n";
                echo "     Title: {$page['title']}\n";
                echo "     Slug: {$page['slug']}\n";
                echo "     Enabled: " . ($page['is_enabled'] ? 'YES' : 'NO') . "\n";
                echo "     Show in Menu: " . ($page['show_in_menu'] ? 'YES' : 'NO') . "\n";
                echo "     Created: {$page['created_at']}\n";
                echo "\n";
            }
        } else {
            echo "   No pages found!\n\n";
        }
        
        // Test API endpoint
        echo "4. Testing API endpoint...\n";
        echo "   URL: http://localhost:8000/api/pages/list?page=1&limit=20&enabled_only=false\n";
        echo "   (Make sure API server is running: php -S localhost:8000 public_html/api/router.php)\n\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

