<?php
/**
 * Login Endpoint
 * Handles user authentication with rate limiting and brute force protection
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/rate_limit.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Apply rate limiting
applyRateLimit();

// Get input
$input = json_decode(file_get_contents('php://input'), true);
$username = sanitizeInput($input['username'] ?? '', 'string');
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Get user with brute force protection check
    $stmt = $db->prepare("
        SELECT id, username, password_hash, role, failed_attempts, locked_until
        FROM admins
        WHERE username = :username
    ");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    if (!$user) {
        // Don't reveal if user exists
        sleep(1); // Prevent timing attacks
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }

    // Check if account is locked
    if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
        http_response_code(423);
        echo json_encode(['error' => 'Account locked. Please try again later.']);
        exit;
    }

    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        // Increment failed attempts
        $failedAttempts = ($user['failed_attempts'] ?? 0) + 1;
        $lockedUntil = null;
        
        // Lock account after 5 failed attempts for 30 minutes
        if ($failedAttempts >= 5) {
            $lockedUntil = date('Y-m-d H:i:s', time() + 1800); // 30 minutes
        }

        $stmt = $db->prepare("
            UPDATE admins 
            SET failed_attempts = :attempts, locked_until = :locked
            WHERE id = :id
        ");
        $stmt->execute([
            'attempts' => $failedAttempts,
            'locked' => $lockedUntil,
            'id' => $user['id']
        ]);

        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }

    // Successful login - reset failed attempts and update last login
    $stmt = $db->prepare("
        UPDATE admins 
        SET failed_attempts = 0, locked_until = NULL, last_login = NOW()
        WHERE id = :id
    ");
    $stmt->execute(['id' => $user['id']]);

    // Regenerate session ID for security
    session_regenerate_id(true);

    // Set session data
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['last_activity'] = time();
    $_SESSION['csrf_token'] = generateCSRFToken();

    // Return success with user info (no sensitive data)
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ],
        'csrf_token' => $_SESSION['csrf_token']
    ]);

} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Login failed']);
}


