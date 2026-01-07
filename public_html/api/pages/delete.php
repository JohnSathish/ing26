<?php
/**
 * Delete Dynamic Page (Soft Delete)
 * Admin only
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/auth.php';

// Check authentication
$user = getCurrentUser();
if (!$user || $user['role'] !== ROLE_ADMIN) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Check CSRF token
require_once __DIR__ . '/../middleware/csrf.php';
validateCSRF();

try {
    $db = Database::getInstance()->getConnection();
    
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid page ID']);
        exit;
    }
    
    // Soft delete
    $stmt = $db->prepare("UPDATE pages SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL");
    $stmt->execute(['id' => $id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Page not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('delete', 'page', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Page deleted successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Page delete error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete page']);
}

