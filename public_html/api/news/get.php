<?php
/**
 * Get Single News Item by Slug
 * Public endpoint - returns a single news item
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get slug from query parameter
    $slug = sanitizeInput($_GET['slug'] ?? '', 'string');
    
    if (empty($slug)) {
        http_response_code(400);
        echo json_encode(['error' => 'Slug is required']);
        exit;
    }
    
    // Check if admin (for unpublished items)
    require_once __DIR__ . '/../middleware/auth.php';
    $user = getCurrentUser();
    $isAdmin = $user && $user['role'] === ROLE_ADMIN;
    
    // Build query
    $where = ["slug = :slug", "deleted_at IS NULL"];
    $params = ['slug' => $slug];
    
    if (!$isAdmin) {
        $where[] = "is_published = 1";
        $where[] = "published_at <= NOW()";
    }
    
      $whereClause = implode(' AND ', $where);

      // Check if event_date column exists (for backward compatibility)
      $columnCheck = $db->query("SHOW COLUMNS FROM news LIKE 'event_date'");
      $hasEventDate = $columnCheck && $columnCheck->rowCount() > 0;
      
      // Build SELECT columns
      $selectColumns = "id, title, slug, content, excerpt, featured_image, is_featured, is_published, published_at, created_at, updated_at";
      if ($hasEventDate) {
          $selectColumns = "id, title, slug, content, excerpt, featured_image, event_date, is_featured, is_published, published_at, created_at, updated_at";
      }

      $sql = "
          SELECT $selectColumns
          FROM news
          WHERE $whereClause
          LIMIT 1
      ";

      $stmt = $db->prepare($sql);
      $stmt->execute($params);
      $newsItem = $stmt->fetch();
      
      if (!$newsItem) {
          http_response_code(404);
          echo json_encode(['error' => 'News item not found']);
          exit;
      }
      
      // Format event_date (ensure YYYY-MM-DD format)
      if (isset($newsItem['event_date']) && $newsItem['event_date']) {
          // If date includes time, extract just the date part
          $dateParts = explode(' ', $newsItem['event_date']);
          $newsItem['event_date'] = $dateParts[0]; // Get YYYY-MM-DD part
      } else {
          $newsItem['event_date'] = null;
      }
      
      echo json_encode([
          'success' => true,
          'data' => $newsItem
      ]);
    
} catch (PDOException $e) {
    error_log("News get error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch news']);
}

