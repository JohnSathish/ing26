<?php
/**
 * Security Configuration
 * CSRF Protection, Security Headers, Rate Limiting, Input Sanitization
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

// Start secure session if not already started
if (session_status() === PHP_SESSION_NONE) {
    // Ensure output buffering is active before starting session
    if (!ob_get_level()) {
        ob_start();
    }
    
    // Set session cookie parameters BEFORE starting session
    if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
        // Development: Allow cross-origin for localhost
        // For localhost with different ports, use Lax and empty domain
        session_set_cookie_params([
            'lifetime' => 1800, // 30 minutes
            'path' => '/',
            'domain' => '', // Empty domain allows localhost across ports
            'secure' => false, // Allow HTTP in development
            'httponly' => true,
            'samesite' => 'Lax' // Lax allows same-site requests
        ]);
    } else {
        // Production: Strict security
        session_set_cookie_params([
            'lifetime' => 1800, // 30 minutes
            'path' => '/',
            'domain' => '',
            'secure' => true, // HTTPS only
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
    }
    
    ini_set('session.use_strict_mode', '1');
    @session_start(); // Suppress any warnings
}

/**
 * Set security headers
 */
function setSecurityHeaders() {
    // Content Security Policy
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';");
    
    // Prevent clickjacking
    header("X-Frame-Options: DENY");
    
    // Prevent MIME type sniffing
    header("X-Content-Type-Options: nosniff");
    
    // XSS Protection
    header("X-XSS-Protection: 1; mode=block");
    
    // Referrer Policy
    header("Referrer-Policy: strict-origin-when-cross-origin");
    
    // Permissions Policy
    header("Permissions-Policy: geolocation=(), microphone=(), camera=()");
    
    // HTTPS enforcement (if on HTTPS)
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        header("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload");
    }
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Validate CSRF token
 */
function validateCSRFToken($token) {
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        return false;
    }
    return true;
}

/**
 * Rate limiting - IP-based
 */
class RateLimiter {
    private static $attempts = [];
    private static $maxAttempts = 5;
    private static $timeWindow = 900; // 15 minutes in seconds

    public static function checkLimit($identifier = null) {
        if ($identifier === null) {
            $identifier = self::getClientIdentifier();
        }

        $now = time();
        
        // Clean old entries
        if (isset(self::$attempts[$identifier])) {
            self::$attempts[$identifier] = array_filter(
                self::$attempts[$identifier],
                function($timestamp) use ($now) {
                    return ($now - $timestamp) < self::$timeWindow;
                }
            );
        } else {
            self::$attempts[$identifier] = [];
        }

        // Check if limit exceeded
        if (count(self::$attempts[$identifier]) >= self::$maxAttempts) {
            return false;
        }

        // Record attempt
        self::$attempts[$identifier][] = $now;
        return true;
    }

    public static function getRemainingAttempts($identifier = null) {
        if ($identifier === null) {
            $identifier = self::getClientIdentifier();
        }

        if (!isset(self::$attempts[$identifier])) {
            return self::$maxAttempts;
        }

        $now = time();
        self::$attempts[$identifier] = array_filter(
            self::$attempts[$identifier],
            function($timestamp) use ($now) {
                return ($now - $timestamp) < self::$timeWindow;
            }
        );

        return max(0, self::$maxAttempts - count(self::$attempts[$identifier]));
    }

    private static function getClientIdentifier() {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        return hash('sha256', $ip . $userAgent);
    }
}

/**
 * Sanitize input - whitelist approach
 */
function sanitizeInput($input, $type = 'string') {
    if ($input === null) {
        return null;
    }

    switch ($type) {
        case 'int':
            return filter_var($input, FILTER_VALIDATE_INT);
        
        case 'email':
            return filter_var($input, FILTER_VALIDATE_EMAIL);
        
        case 'url':
            return filter_var($input, FILTER_VALIDATE_URL);
        
        case 'string':
        default:
            // Remove null bytes and trim
            $input = str_replace("\0", '', $input);
            $input = trim($input);
            // Basic XSS prevention
            return htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    }
}

/**
 * Escape output for HTML
 */
function escapeOutput($data) {
    if (is_array($data)) {
        return array_map('escapeOutput', $data);
    }
    return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

/**
 * Validate file upload
 */
function validateFileUpload($file, $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], $maxSize = 5242880) {
    // 5MB default max size
    
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        return ['valid' => false, 'error' => 'File upload error'];
    }

    // Check file size
    if ($file['size'] > $maxSize) {
        return ['valid' => false, 'error' => 'File size exceeds limit'];
    }

    // Check MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        return ['valid' => false, 'error' => 'Invalid file type'];
    }

    // Additional security: check file extension
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    
    if (!in_array($extension, $allowedExtensions)) {
        return ['valid' => false, 'error' => 'Invalid file extension'];
    }

    return ['valid' => true, 'mime' => $mimeType, 'extension' => $extension];
}

// Set security headers on include
setSecurityHeaders();


