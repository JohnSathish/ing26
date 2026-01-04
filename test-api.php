<?php
/**
 * Quick API Test Script
 * Run: php test-api.php
 */

echo "=== API Configuration Test ===\n\n";

// Test database connection
echo "1. Testing database connection...\n";
require_once 'public_html/api/config/database.php';
require_once 'public_html/api/config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "   ✓ Database connection: OK\n";
    
    // Test query
    $stmt = $db->query("SELECT COUNT(*) as count FROM admins");
    $result = $stmt->fetch();
    echo "   ✓ Test query: OK (Found {$result['count']} admin(s))\n";
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test PHP version
echo "\n2. PHP Configuration:\n";
echo "   ✓ PHP Version: " . phpversion() . "\n";
echo "   ✓ PDO Available: " . (extension_loaded('pdo') ? 'Yes' : 'No') . "\n";
echo "   ✓ PDO MySQL Available: " . (extension_loaded('pdo_mysql') ? 'Yes' : 'No') . "\n";

// Test required functions
echo "\n3. Required Functions:\n";
$functions = ['password_hash', 'password_verify', 'session_start', 'json_encode'];
foreach ($functions as $func) {
    echo "   " . (function_exists($func) ? '✓' : '✗') . " $func\n";
}

// Test file permissions
echo "\n4. File Permissions:\n";
$dirs = ['public_html/api', 'public_html/uploads'];
foreach ($dirs as $dir) {
    if (is_dir($dir)) {
        $writable = is_writable($dir) ? 'Writable' : 'Not Writable';
        echo "   ✓ $dir: $writable\n";
    } else {
        echo "   ✗ $dir: Directory not found\n";
    }
}

echo "\n=== Test Complete ===\n";


