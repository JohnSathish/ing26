<?php
/**
 * Rate Limiting Middleware
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

require_once __DIR__ . '/../config/security.php';

/**
 * Apply rate limiting
 */
function applyRateLimit() {
    if (!RateLimiter::checkLimit()) {
        $remaining = RateLimiter::getRemainingAttempts();
        http_response_code(429);
        header('Content-Type: application/json');
        header('Retry-After: 900'); // 15 minutes
        echo json_encode([
            'error' => 'Too many requests. Please try again later.',
            'retry_after' => 900
        ]);
        exit;
    }
}


