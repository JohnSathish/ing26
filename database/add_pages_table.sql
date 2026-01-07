-- Dynamic Pages Table
-- Allows creating and managing custom pages from admin panel

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
  parent_menu VARCHAR(100) DEFAULT NULL COMMENT 'Parent menu item (e.g., "about", "council", "houses")',
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

