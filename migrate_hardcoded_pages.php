<?php
/**
 * Migrate Hardcoded Pages to Dynamic Pages System
 * This script creates dynamic page entries for all existing hardcoded pages
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/security.php';
require_once __DIR__ . '/public_html/api/config/constants.php';
require_once __DIR__ . '/public_html/api/middleware/auth.php';

// Start session for authentication
session_start();

// Define all hardcoded pages with their details
$pages = [
    // About Us Section
    [
        'title' => 'About Us',
        'slug' => 'about-us',
        'menu_label' => 'About Us',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 1,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Learn about our organization, mission, and values.',
        'content' => '<h2>About Us</h2><p>Welcome to our organization. We are dedicated to serving our community with dedication and commitment.</p>',
    ],
    [
        'title' => 'Our Vision',
        'slug' => 'our-vision',
        'menu_label' => 'Our Vision',
        'parent_menu' => 'about',
        'is_submenu' => true,
        'show_in_menu' => true,
        'sort_order' => 1,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Our vision for the future and our aspirations.',
        'content' => '<h2>Our Vision</h2><p>Our vision is to create a better future for all through education, service, and community engagement.</p>',
    ],
    [
        'title' => 'Our Mission',
        'slug' => 'our-mission',
        'menu_label' => 'Our Mission',
        'parent_menu' => 'about',
        'is_submenu' => true,
        'show_in_menu' => true,
        'sort_order' => 2,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Our mission statement and core values.',
        'content' => '<h2>Our Mission</h2><p>Our mission is to serve the community with excellence, integrity, and compassion.</p>',
    ],
    
    // Don Bosco & GC29
    [
        'title' => 'Don Bosco',
        'slug' => 'don-bosco',
        'menu_label' => 'Don Bosco',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 2,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Learn about St. John Bosco and his legacy.',
        'content' => '<h2>Don Bosco</h2><p>St. John Bosco, also known as Don Bosco, was an Italian Catholic priest, educator, and writer who dedicated his life to the education and care of young people.</p>',
    ],
    [
        'title' => 'GC29',
        'slug' => 'gc29',
        'menu_label' => 'GC29',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 3,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Information about the 29th General Chapter.',
        'content' => '<h2>GC29</h2><p>The 29th General Chapter is a significant event in our organization\'s history.</p>',
    ],
    
    // Provincials Section
    [
        'title' => 'Provincials',
        'slug' => 'provincials',
        'menu_label' => 'Provincials',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 4,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Meet our provincials and leadership team.',
        'content' => '<h2>Provincials</h2><p>Our provincial leadership team guides our organization with wisdom and dedication.</p>',
    ],
    [
        'title' => 'Vice Provincial',
        'slug' => 'vice-provincial',
        'menu_label' => 'Vice Provincial',
        'parent_menu' => 'provincials',
        'is_submenu' => true,
        'show_in_menu' => true,
        'sort_order' => 1,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Information about the Vice Provincial.',
        'content' => '<h2>Vice Provincial</h2><p>The Vice Provincial supports the Provincial in leading our organization.</p>',
    ],
    [
        'title' => 'Economer',
        'slug' => 'economer',
        'menu_label' => 'Economer',
        'parent_menu' => 'provincials',
        'is_submenu' => true,
        'show_in_menu' => true,
        'sort_order' => 2,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Information about the Economer.',
        'content' => '<h2>Economer</h2><p>The Economer manages the financial affairs of our organization.</p>',
    ],
    [
        'title' => 'Provincial Secretary',
        'slug' => 'provincial-secretary',
        'menu_label' => 'Provincial Secretary',
        'parent_menu' => 'provincials',
        'is_submenu' => true,
        'show_in_menu' => true,
        'sort_order' => 3,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Information about the Provincial Secretary.',
        'content' => '<h2>Provincial Secretary</h2><p>The Provincial Secretary handles administrative and communication matters.</p>',
    ],
    
    // Council Section
    [
        'title' => 'Council',
        'slug' => 'council',
        'menu_label' => 'Council',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 5,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Our council members and their roles.',
        'content' => '<h2>Council</h2><p>Our council members work together to guide and support our organization.</p>',
    ],
    [
        'title' => 'Councillors 2024-2025',
        'slug' => 'councillors-2024-2025',
        'menu_label' => 'Councillors 2024-2025',
        'parent_menu' => 'council',
        'is_submenu' => true,
        'show_in_menu' => true,
        'sort_order' => 1,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Council members for the term 2024-2025.',
        'content' => '<h2>Councillors 2024-2025</h2><p>Meet the council members serving for the term 2024-2025.</p>',
    ],
    
    // Dimension
    [
        'title' => 'Dimension',
        'slug' => 'dimension',
        'menu_label' => 'Dimension',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 6,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Information about our dimensions and areas of work.',
        'content' => '<h2>Dimension</h2><p>Our organization works across multiple dimensions to serve the community.</p>',
    ],
    
    // Other Pages
    [
        'title' => 'Circulars',
        'slug' => 'circulars',
        'menu_label' => 'Circulars',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 7,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Browse our circulars and official communications.',
        'content' => '<h2>Circulars</h2><p>Access our official circulars and communications.</p>',
    ],
    [
        'title' => 'NewsLine',
        'slug' => 'newsline',
        'menu_label' => 'NewsLine',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 8,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Read our NewsLine publications.',
        'content' => '<h2>NewsLine</h2><p>Stay updated with our NewsLine publications.</p>',
    ],
    [
        'title' => 'Gallery',
        'slug' => 'gallery',
        'menu_label' => 'Gallery',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 9,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Browse our photo gallery.',
        'content' => '<h2>Gallery</h2><p>View our collection of photos and memories.</p>',
    ],
    [
        'title' => 'All News',
        'slug' => 'all-news',
        'menu_label' => 'All News',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 10,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Browse all news articles.',
        'content' => '<h2>All News</h2><p>Read all our news articles and updates.</p>',
    ],
    [
        'title' => 'Province',
        'slug' => 'province',
        'menu_label' => 'Province',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 11,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Information about our province.',
        'content' => '<h2>Province</h2><p>Learn about our province and its activities.</p>',
    ],
    [
        'title' => 'Provincial Message',
        'slug' => 'provincial-message',
        'menu_label' => 'Provincial Message',
        'parent_menu' => '',
        'is_submenu' => false,
        'show_in_menu' => true,
        'sort_order' => 12,
        'is_enabled' => true,
        'is_featured' => false,
        'excerpt' => 'Read messages from our Provincial.',
        'content' => '<h2>Provincial Message</h2><p>Messages and communications from our Provincial.</p>',
    ],
];

try {
    $db = Database::getInstance()->getConnection();
    
    echo "=== Migrating Hardcoded Pages to Dynamic Pages ===\n\n";
    
    $created = 0;
    $skipped = 0;
    $errors = 0;
    
    foreach ($pages as $pageData) {
        // Check if page already exists
        $checkStmt = $db->prepare("SELECT id FROM pages WHERE slug = :slug AND deleted_at IS NULL");
        $checkStmt->execute(['slug' => $pageData['slug']]);
        
        if ($checkStmt->fetch()) {
            echo "⏭️  Skipping: {$pageData['title']} (slug: {$pageData['slug']}) - already exists\n";
            $skipped++;
            continue;
        }
        
        // Insert page
        $stmt = $db->prepare("
            INSERT INTO pages (
                title, slug, content, excerpt, meta_title, meta_description,
                menu_label, menu_position, parent_menu, is_submenu,
                is_enabled, is_featured, show_in_menu, sort_order
            ) VALUES (
                :title, :slug, :content, :excerpt, :meta_title, :meta_description,
                :menu_label, :menu_position, :parent_menu, :is_submenu,
                :is_enabled, :is_featured, :show_in_menu, :sort_order
            )
        ");
        
        $metaTitle = $pageData['meta_title'] ?? $pageData['title'];
        $metaDescription = $pageData['meta_description'] ?? $pageData['excerpt'];
        
        $stmt->execute([
            'title' => $pageData['title'],
            'slug' => $pageData['slug'],
            'content' => $pageData['content'],
            'excerpt' => $pageData['excerpt'],
            'meta_title' => $metaTitle,
            'meta_description' => $metaDescription,
            'menu_label' => $pageData['menu_label'],
            'menu_position' => $pageData['menu_position'] ?? 0,
            'parent_menu' => $pageData['parent_menu'] ?: null,
            'is_submenu' => $pageData['is_submenu'] ? 1 : 0,
            'is_enabled' => $pageData['is_enabled'] ? 1 : 0,
            'is_featured' => $pageData['is_featured'] ? 1 : 0,
            'show_in_menu' => $pageData['show_in_menu'] ? 1 : 0,
            'sort_order' => $pageData['sort_order'],
        ]);
        
        $id = $db->lastInsertId();
        echo "✅ Created: {$pageData['title']} (ID: {$id}, slug: {$pageData['slug']})\n";
        $created++;
    }
    
    echo "\n=== Migration Complete ===\n";
    echo "✅ Created: {$created} pages\n";
    echo "⏭️  Skipped: {$skipped} pages (already exist)\n";
    echo "❌ Errors: {$errors} pages\n";
    echo "\nYou can now manage these pages from the Admin Panel → Dynamic Pages\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

