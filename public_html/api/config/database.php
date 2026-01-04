<?php
/**
 * Secure Database Configuration
 * Database credentials should be stored outside public_html if possible
 * or use cPanel environment variables
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

// Database configuration
// TODO: Move these to environment variables or secure config file outside public_html
define('DB_HOST', 'localhost');
define('DB_NAME', 'cmd_ing_guwahati');
define('DB_USER', 'root'); // Change if using different MySQL user
define('DB_PASS', 'john@1991js'); // Change if MySQL has password (XAMPP default is empty)
define('DB_CHARSET', 'utf8mb4');

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false, // Use native prepared statements
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
        ];

        try {
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Log error securely (don't expose details)
            error_log("Database connection failed: " . $e->getMessage());
            
            // Return generic error in production
            if (defined('ENVIRONMENT') && ENVIRONMENT === 'production') {
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed']);
                exit;
            } else {
                // In development, show more details
                http_response_code(500);
                echo json_encode([
                    'error' => 'Database connection failed',
                    'message' => $e->getMessage(),
                    'hint' => 'Make sure MySQL is running and the database "' . DB_NAME . '" exists. Check database credentials in config/database.php'
                ]);
                exit;
            }
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }

    // Prevent cloning
    private function __clone() {}

    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}


