<?php
/**
 * Add event_date column to news table
 * Run this once to add the column
 * Access via: http://localhost:8000/api/setup/add_event_date.php
 * Then delete this file for security
 */

// Prevent direct access in production
if (php_sapi_name() !== 'cli' && (!isset($_SERVER['HTTP_HOST']) || $_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false) {
    // Allow localhost only
} else {
    http_response_code(403);
    die('Access denied. This script should only be run on localhost.');
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';

header('Content-Type: text/html; charset=utf-8');

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if column already exists
    $checkStmt = $db->query("SHOW COLUMNS FROM news LIKE 'event_date'");
    if ($checkStmt && $checkStmt->rowCount() > 0) {
        echo "<h2>✅ Column Already Exists</h2>";
        echo "<p>The <code>event_date</code> column already exists in the <code>news</code> table.</p>";
        echo "<p><strong>You can delete this file now.</strong></p>";
        exit;
    }
    
    // Add the column
    echo "<h2>Adding event_date Column...</h2>";
    
    $db->exec("ALTER TABLE news ADD COLUMN event_date DATE NULL AFTER published_at");
    echo "<p>✅ Column <code>event_date</code> added successfully!</p>";
    
    // Add index
    $db->exec("ALTER TABLE news ADD INDEX idx_event_date (event_date)");
    echo "<p>✅ Index <code>idx_event_date</code> added successfully!</p>";
    
    // Verify
    $verifyStmt = $db->query("SHOW COLUMNS FROM news LIKE 'event_date'");
    if ($verifyStmt && $verifyStmt->rowCount() > 0) {
        $column = $verifyStmt->fetch();
        echo "<h3>✅ Verification Successful</h3>";
        echo "<pre>";
        print_r($column);
        echo "</pre>";
        echo "<p><strong style='color: green;'>The event_date column has been successfully added!</strong></p>";
        echo "<p><strong>You can now delete this file for security.</strong></p>";
    } else {
        echo "<p style='color: red;'>❌ Error: Column was not created properly.</p>";
    }
    
} catch (PDOException $e) {
    echo "<h2 style='color: red;'>❌ Error</h2>";
    echo "<p><strong>Error message:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "<p>The column already exists. You can delete this file.</p>";
    } else {
        echo "<p>Please check your database connection and try again.</p>";
    }
}

