<?php
/**
 * Remove Duplicate News Items
 * Deletes duplicate news items, keeping the oldest one in each group
 */

define('API_ACCESS', true);
require_once __DIR__ . '/public_html/api/config/database.php';

echo "=== Removing Duplicate News Items ===\n\n";

// Check if duplicate data file exists
if (!file_exists('duplicate_news_data.json')) {
    echo "❌ Error: duplicate_news_data.json not found.\n";
    echo "Please run find_duplicate_news.php first.\n";
    exit(1);
}

$duplicateData = json_decode(file_get_contents('duplicate_news_data.json'), true);

if (empty($duplicateData)) {
    echo "✅ No duplicates to remove!\n";
    exit(0);
}

try {
    $db = Database::getInstance()->getConnection();
    
    $totalDeleted = 0;
    $totalKept = 0;
    $errors = [];
    
    echo "Processing " . count($duplicateData) . " duplicate groups...\n\n";
    
    foreach ($duplicateData as $group) {
        $ids = $group['ids'];
        $title = $group['title'];
        
        // Sort IDs to keep the oldest (lowest ID, assuming auto-increment)
        sort($ids, SORT_NUMERIC);
        $keepId = $ids[0]; // Keep the first (oldest) one
        $deleteIds = array_slice($ids, 1); // Delete the rest
        
        echo "Processing: \"$title\"\n";
        echo "  Keeping ID: $keepId\n";
        echo "  Deleting IDs: " . implode(', ', $deleteIds) . "\n";
        
        // Soft delete duplicates (set deleted_at timestamp)
        foreach ($deleteIds as $id) {
            try {
                $stmt = $db->prepare("
                    UPDATE news 
                    SET deleted_at = NOW() 
                    WHERE id = :id AND deleted_at IS NULL
                ");
                $stmt->execute(['id' => $id]);
                
                if ($stmt->rowCount() > 0) {
                    $totalDeleted++;
                    echo "    ✓ Deleted ID $id\n";
                } else {
                    echo "    ⚠ ID $id was already deleted or not found\n";
                }
            } catch (PDOException $e) {
                $errors[] = "Failed to delete ID $id: " . $e->getMessage();
                echo "    ❌ Error deleting ID $id: " . $e->getMessage() . "\n";
            }
        }
        
        $totalKept++;
        echo "\n";
    }
    
    echo "=== Summary ===\n";
    echo "✅ Kept: $totalKept items (one from each duplicate group)\n";
    echo "🗑️  Deleted: $totalDeleted duplicate items\n";
    
    if (!empty($errors)) {
        echo "\n⚠️  Errors encountered:\n";
        foreach ($errors as $error) {
            echo "  - $error\n";
        }
    }
    
    echo "\n✅ Duplicate removal complete!\n";
    echo "\nNote: Items are soft-deleted (deleted_at is set).\n";
    echo "They can be restored from the database if needed.\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

