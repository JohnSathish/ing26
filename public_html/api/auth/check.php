<?php
/**
 * Session Check Endpoint
 * Returns current user session status
 * Always returns 200 - this is a status check, not an authentication requirement
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../middleware/auth.php';

$user = getCurrentUser();

if ($user) {
    echo json_encode([
        'authenticated' => true,
        'user' => $user,
        'csrf_token' => generateCSRFToken()
    ]);
} else {
    // Return 200 with authenticated: false - this is a status check, not an error
    // 401 should only be used when authentication is required but missing
    http_response_code(200);
    echo json_encode([
        'authenticated' => false,
        'csrf_token' => generateCSRFToken() // Still provide CSRF token for public endpoints
    ]);
}


