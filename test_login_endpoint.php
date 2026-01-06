<?php
/**
 * Test Login Endpoint
 * This will help diagnose the 500 error
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== Testing Login Endpoint ===\n\n";

// Test 1: Check if database connection works
echo "Test 1: Database Connection\n";
try {
    define('API_ACCESS', true);
    require_once __DIR__ . '/public_html/api/config/database.php';
    $db = Database::getInstance()->getConnection();
    echo "✅ Database connection successful\n\n";
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Check if admins table exists
echo "Test 2: Check admins table\n";
try {
    $stmt = $db->query("SHOW TABLES LIKE 'admins'");
    if ($stmt->rowCount() > 0) {
        echo "✅ admins table exists\n";
        
        // Check if table has columns
        $stmt = $db->query("DESCRIBE admins");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "   Columns: " . implode(', ', $columns) . "\n";
        
        // Check if there are any admin users
        $stmt = $db->query("SELECT COUNT(*) as count FROM admins");
        $count = $stmt->fetch()['count'];
        echo "   Admin users: $count\n";
        
        if ($count > 0) {
            $stmt = $db->query("SELECT id, username, role FROM admins LIMIT 5");
            $users = $stmt->fetchAll();
            echo "   Sample users:\n";
            foreach ($users as $user) {
                echo "     - ID: {$user['id']}, Username: {$user['username']}, Role: {$user['role']}\n";
            }
        } else {
            echo "   ⚠️  No admin users found!\n";
        }
    } else {
        echo "❌ admins table does not exist\n";
    }
    echo "\n";
} catch (Exception $e) {
    echo "❌ Error checking admins table: " . $e->getMessage() . "\n\n";
}

// Test 3: Test login endpoint directly
echo "Test 3: Test login endpoint\n";
$testData = json_encode([
    'username' => 'admin',
    'password' => 'test'
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $testData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "❌ Connection error: $error\n";
    echo "   Make sure API server is running: php -S localhost:8000 api/router.php\n";
} else {
    echo "HTTP Status: $httpCode\n";
    if ($httpCode === 500) {
        echo "❌ Server error (500)\n";
        echo "Response: " . substr($response, 0, 500) . "\n";
        echo "\nCheck PHP error logs or enable error display in login.php\n";
    } else {
        echo "Response: " . substr($response, 0, 200) . "\n";
    }
}

echo "\n=== Test Complete ===\n";

