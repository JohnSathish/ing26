<?php
/**
 * Check Database Connection
 * Quick test to verify database is connected
 */

echo "=== Database Connection Check ===\n\n";

// Test 1: Load database config
echo "Test 1: Loading database configuration...\n";
try {
    define('API_ACCESS', true);
    require_once __DIR__ . '/public_html/api/config/database.php';
    echo "✅ Database config loaded successfully\n\n";
} catch (Exception $e) {
    echo "❌ Failed to load config: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Get database connection
echo "Test 2: Connecting to database...\n";
try {
    $db = Database::getInstance()->getConnection();
    echo "✅ Database connection established\n\n";
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n\n";
    echo "Check your database credentials in: public_html/api/config/database.php\n";
    exit(1);
}

// Test 3: Check database name
echo "Test 3: Database information...\n";
try {
    $stmt = $db->query("SELECT DATABASE() as db_name");
    $result = $stmt->fetch();
    echo "✅ Connected to database: " . ($result['db_name'] ?? 'Unknown') . "\n";
    
    $stmt = $db->query("SELECT VERSION() as version");
    $result = $stmt->fetch();
    echo "✅ MySQL version: " . ($result['version'] ?? 'Unknown') . "\n\n";
} catch (Exception $e) {
    echo "⚠️  Could not get database info: " . $e->getMessage() . "\n\n";
}

// Test 4: Check if tables exist
echo "Test 4: Checking important tables...\n";
$tables = ['admins', 'news', 'banners', 'collaborations', 'houses'];
$existingTables = [];

foreach ($tables as $table) {
    try {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            // Get row count
            $countStmt = $db->query("SELECT COUNT(*) as count FROM $table");
            $count = $countStmt->fetch()['count'];
            echo "✅ Table '$table' exists ($count rows)\n";
            $existingTables[] = $table;
        } else {
            echo "❌ Table '$table' does NOT exist\n";
        }
    } catch (Exception $e) {
        echo "❌ Error checking table '$table': " . $e->getMessage() . "\n";
    }
}

echo "\n";

// Test 5: Check admin user
echo "Test 5: Checking admin user...\n";
if (in_array('admins', $existingTables)) {
    try {
        $stmt = $db->query("SELECT id, username, role FROM admins LIMIT 5");
        $users = $stmt->fetchAll();
        if (count($users) > 0) {
            echo "✅ Found " . count($users) . " admin user(s):\n";
            foreach ($users as $user) {
                echo "   - ID: {$user['id']}, Username: {$user['username']}, Role: {$user['role']}\n";
            }
        } else {
            echo "⚠️  No admin users found in database\n";
        }
    } catch (Exception $e) {
        echo "❌ Error checking admin users: " . $e->getMessage() . "\n";
    }
} else {
    echo "⚠️  Cannot check admin users - admins table doesn't exist\n";
}

echo "\n";

// Test 6: Test a simple query
echo "Test 6: Testing a simple query...\n";
try {
    $stmt = $db->query("SELECT 1 as test");
    $result = $stmt->fetch();
    if ($result && $result['test'] == 1) {
        echo "✅ Query execution successful\n";
    } else {
        echo "❌ Query returned unexpected result\n";
    }
} catch (Exception $e) {
    echo "❌ Query execution failed: " . $e->getMessage() . "\n";
}

echo "\n";
echo "=== Summary ===\n";
echo "Database Status: " . (count($existingTables) > 0 ? "✅ CONNECTED" : "❌ NOT CONNECTED") . "\n";
echo "Tables Found: " . count($existingTables) . "/" . count($tables) . "\n";
echo "\n";

if (count($existingTables) == count($tables)) {
    echo "✅ Database is fully connected and all tables exist!\n";
} elseif (count($existingTables) > 0) {
    echo "⚠️  Database is connected but some tables are missing.\n";
} else {
    echo "❌ Database connection failed or database is empty.\n";
    echo "   You may need to import the database schema.\n";
}

