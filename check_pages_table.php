<?php
/**
 * Check if pages table exists and create it if needed
 */

// Bypass API_ACCESS check for CLI
if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/public_html/api/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if table exists
    $stmt = $db->query("SHOW TABLES LIKE 'pages'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Pages table already exists!\n";
        exit(0);
    }
    
    // Create the table
    echo "Creating pages table...\n";
    
    $sql = "
    CREATE TABLE IF NOT EXISTS pages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      content TEXT,
      excerpt TEXT,
      meta_title VARCHAR(255),
      meta_description TEXT,
      featured_image VARCHAR(255),
      menu_label VARCHAR(255),
      menu_position INT DEFAULT 0,
      parent_menu VARCHAR(100) DEFAULT NULL COMMENT 'Parent menu item (e.g., \"about\", \"council\", \"houses\")',
      is_submenu BOOLEAN DEFAULT FALSE,
      is_enabled BOOLEAN DEFAULT TRUE,
      is_featured BOOLEAN DEFAULT FALSE,
      show_in_menu BOOLEAN DEFAULT TRUE,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      INDEX idx_slug (slug),
      INDEX idx_enabled (is_enabled),
      INDEX idx_menu (show_in_menu, parent_menu, sort_order),
      INDEX idx_deleted (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $db->exec($sql);
    
    echo "✅ Pages table created successfully!\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

