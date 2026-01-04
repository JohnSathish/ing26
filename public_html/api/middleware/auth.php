<?php
/**
 * Authentication Middleware
 * Validates user sessions and role-based access
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
        return false;
    }

    // Check session timeout
    if (isset($_SESSION['last_activity']) && 
        (time() - $_SESSION['last_activity']) > SESSION_TIMEOUT) {
        session_destroy();
        return false;
    }

    // Update last activity
    $_SESSION['last_activity'] = time();
    return true;
}

/**
 * Require authentication - returns user data or sends 401
 */
function requireAuth() {
    if (!isAuthenticated()) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }

    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role'] ?? ROLE_EDITOR
    ];
}

/**
 * Require specific role
 */
function requireRole($requiredRole) {
    $user = requireAuth();
    
    if ($user['role'] !== $requiredRole && $requiredRole === ROLE_ADMIN) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Insufficient permissions']);
        exit;
    }

    return $user;
}

/**
 * Require admin role
 */
function requireAdmin() {
    return requireRole(ROLE_ADMIN);
}

/**
 * Get current user (without requiring auth)
 */
function getCurrentUser() {
    if (!isAuthenticated()) {
        return null;
    }

    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role'] ?? ROLE_EDITOR
    ];
}


