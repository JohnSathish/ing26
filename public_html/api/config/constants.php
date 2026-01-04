<?php
/**
 * Application Constants
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

// Environment
define('ENVIRONMENT', 'development'); // Change to 'production' for production

// API Configuration
define('API_VERSION', '1.0');
define('SESSION_TIMEOUT', 1800); // 30 minutes in seconds

// File Upload Configuration
define('UPLOAD_DIR', __DIR__ . '/../../uploads/');
define('MAX_FILE_SIZE', 5242880); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif']);

// Pagination
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// User Roles
define('ROLE_ADMIN', 'admin');
define('ROLE_EDITOR', 'editor');

// Content Status
define('STATUS_ACTIVE', 1);
define('STATUS_INACTIVE', 0);
define('STATUS_PUBLISHED', 1);
define('STATUS_DRAFT', 0);


