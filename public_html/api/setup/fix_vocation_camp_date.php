<?php
/**
 * Fix the published_at date for "Vocation Camp for Assam Plain Region Inaugurated at Dimakuchi"
 * Correct date: December 27, 2025
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/auth.php';

// Require admin
requireAdmin();

try {
    $db = Database::getInstance()->getConnection();
    
    // Find the news item by title
    $stmt = $db->prepare("
        SELECT id, title, slug, published_at 
        FROM news 
        WHERE title LIKE :title_pattern 
           OR slug LIKE :slug_pattern
        LIMIT 1
    ");
    
    $titlePattern = '%Vocation Camp for Assam Plain Region%';
    $slugPattern = '%vocation-camp-assam-plain-region%';
    
    $stmt->execute([
        'title_pattern' => $titlePattern,
        'slug_pattern' => $slugPattern
    ]);
    
    $newsItem = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$newsItem) {
        echo json_encode([
            'success' => false,
            'message' => 'News item not found. Please check the title or slug.'
        ]);
        exit;
    }
    
    // Update the published_at date to December 27, 2025
    $updateStmt = $db->prepare("
        UPDATE news 
        SET published_at = :published_at 
        WHERE id = :id
    ");
    
    $updateStmt->execute([
        'published_at' => '2025-12-27 00:00:00',
        'id' => $newsItem['id']
    ]);
    
    // Verify the update
    $verifyStmt = $db->prepare("
        SELECT id, title, slug, published_at, 
               DATE_FORMAT(published_at, '%M %d, %Y') as formatted_date
        FROM news 
        WHERE id = :id
    ");
    
    $verifyStmt->execute(['id' => $newsItem['id']]);
    $updatedItem = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Date updated successfully',
        'data' => [
            'id' => $updatedItem['id'],
            'title' => $updatedItem['title'],
            'old_date' => $newsItem['published_at'],
            'new_date' => $updatedItem['published_at'],
            'formatted_date' => $updatedItem['formatted_date']
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Fix date error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to update date: ' . $e->getMessage()
    ]);
}

