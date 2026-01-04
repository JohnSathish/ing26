<?php
/**
 * Update Setting
 * Admin only
 */

// Enable error reporting in development
if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    error_reporting(0);
}

// Start output buffering
ob_start();

// Set error handler for development
if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
    set_error_handler(function($errno, $errstr, $errfile, $errline) {
        if (error_reporting() === 0) return false;
        ob_clean();
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'PHP Error',
            'message' => $errstr,
            'file' => $errfile,
            'line' => $errline,
            'type' => 'Error'
        ]);
        ob_end_flush();
        exit;
    }, E_ALL);
    
    // Set exception handler
    set_exception_handler(function($exception) {
        ob_clean();
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Uncaught Exception',
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ]);
        ob_end_flush();
        exit;
    });
}

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php'; // This starts the session
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/csrf.php';

// Clean any output before JSON (after all includes)
ob_clean();

// Only allow PUT/PATCH
if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH'])) {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    ob_end_flush();
    exit;
}

// Require admin (this will exit with 401 if not authenticated)
requireAdmin();

// Validate CSRF (this will exit with 403 if invalid)
validateCSRF();

// Get key
$key = sanitizeInput($_GET['key'] ?? '', 'string');
$input = json_decode(file_get_contents('php://input'), true);

if (empty($key)) {
    $key = sanitizeInput($input['key'] ?? '', 'string');
}

if (empty($key)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Setting key is required']);
    ob_end_flush();
    exit;
}

$value = $input['value'] ?? '';
$type = sanitizeInput($input['type'] ?? 'text', 'string');

// Debug logging in development
if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
    error_log("Settings update - Key: $key, Value: " . substr($value, 0, 50) . ", Type: $type");
    error_log("Input data: " . json_encode($input));
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if settings table exists
    $tableCheck = $db->query("SHOW TABLES LIKE 'settings'");
    if ($tableCheck->rowCount() === 0) {
        throw new Exception('Settings table does not exist. Please run database migration.');
    }
    
    // Update or insert
    // Note: Use different parameter names for UPDATE clause to avoid PDO parameter binding issues
    $stmt = $db->prepare("
        INSERT INTO settings (key_name, value, type)
        VALUES (:key, :value, :type)
        ON DUPLICATE KEY UPDATE value = :value_update, type = :type_update, updated_at = CURRENT_TIMESTAMP
    ");
    
    $result = $stmt->execute([
        'key' => $key,
        'value' => $value,
        'type' => $type,
        'value_update' => $value,
        'type_update' => $type
    ]);
    
    if (!$result) {
        $errorInfo = $stmt->errorInfo();
        throw new PDOException("Database error: " . ($errorInfo[2] ?? 'Unknown error'));
    }
    
    // Log action (don't fail if audit log fails)
    try {
        require_once __DIR__ . '/../utils/audit.php';
        auditLog('update', 'setting', $key);
    } catch (Exception $e) {
        // Silently fail audit logging
        error_log("Audit log error: " . $e->getMessage());
    }
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Setting updated successfully'
    ]);
    ob_end_flush();
    
} catch (PDOException $e) {
    error_log("Settings update error: " . $e->getMessage());
    ob_clean(); // Clear any output
    http_response_code(500);
    header('Content-Type: application/json');
    
    // Return generic error in production, detailed in development
    if (defined('ENVIRONMENT') && ENVIRONMENT === 'production') {
        echo json_encode(['error' => 'Failed to update setting']);
    } else {
        echo json_encode([
            'error' => 'Failed to update setting',
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);
    }
    ob_end_flush();
    exit;
} catch (Exception $e) {
    error_log("Settings update error: " . $e->getMessage());
    ob_clean(); // Clear any output
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Failed to update setting',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'type' => get_class($e)
    ]);
    ob_end_flush();
    exit;
}

