<?php
/**
 * CSRF Protection Middleware
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

require_once __DIR__ . '/../config/security.php';

/**
 * Validate CSRF token for state-changing operations
 */
function validateCSRF() {
    // Only validate for POST, PUT, DELETE, PATCH
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
        return true;
    }

    $token = null;
    
    // Get token from header (preferred) or POST data
    if (isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'];
    } elseif (isset($_POST['csrf_token'])) {
        $token = $_POST['csrf_token'];
    } elseif (isset($_SERVER['HTTP_CONTENT_TYPE']) && 
              strpos($_SERVER['HTTP_CONTENT_TYPE'], 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['csrf_token'])) {
            $token = $input['csrf_token'];
        }
    }

    if ($token === null || !validateCSRFToken($token)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid CSRF token']);
        exit;
    }

    return true;
}


