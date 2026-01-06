<?php
/**
 * Find Duplicate News Items
 * Identifies duplicate news items by title
 */

define('API_ACCESS', true);
require_once __DIR__ . '/public_html/api/config/database.php';

echo "=== Finding Duplicate News Items ===\n\n";

try {
    $db = Database::getInstance()->getConnection();
    
    // Find duplicates by title (case-insensitive)
    $sql = "
        SELECT 
            LOWER(TRIM(title)) as normalized_title,
            COUNT(*) as count,
            GROUP_CONCAT(id ORDER BY id) as ids
        FROM news
        WHERE deleted_at IS NULL
        GROUP BY LOWER(TRIM(title))
        HAVING COUNT(*) > 1
        ORDER BY count DESC, normalized_title
    ";
    
    $stmt = $db->query($sql);
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($duplicates)) {
        echo "✅ No duplicate news items found!\n";
        exit(0);
    }
    
    echo "Found " . count($duplicates) . " duplicate groups:\n\n";
    
    $totalDuplicates = 0;
    $duplicateDetails = [];
    
    foreach ($duplicates as $dup) {
        $ids = explode(',', $dup['ids']);
        $count = count($ids);
        $totalDuplicates += ($count - 1); // -1 because we keep one
        
        echo "Title: \"{$dup['normalized_title']}\"\n";
        echo "  Count: {$dup['count']} duplicates\n";
        echo "  IDs: " . implode(', ', $ids) . "\n";
        
        // Get details of each duplicate
        $detailsSql = "SELECT id, title, created_at, is_published FROM news WHERE id IN (" . implode(',', $ids) . ") ORDER BY id";
        $detailsStmt = $db->query($detailsSql);
        $details = $detailsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "  Details:\n";
        foreach ($details as $detail) {
            $status = $detail['is_published'] ? 'Published' : 'Draft';
            echo "    - ID {$detail['id']}: Created {$detail['created_at']}, Status: {$status}\n";
        }
        echo "\n";
        
        $duplicateDetails[] = [
            'title' => $dup['normalized_title'],
            'ids' => $ids,
            'count' => $count
        ];
    }
    
    echo "=== Summary ===\n";
    echo "Total duplicate groups: " . count($duplicates) . "\n";
    echo "Total duplicate items to remove: $totalDuplicates\n";
    echo "Items to keep: " . count($duplicates) . "\n\n";
    
    // Save details to file for deletion script
    file_put_contents('duplicate_news_data.json', json_encode($duplicateDetails, JSON_PRETTY_PRINT));
    echo "✅ Duplicate data saved to: duplicate_news_data.json\n";
    echo "\nRun remove_duplicate_news.php to delete duplicates (keeps the oldest item in each group)\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

