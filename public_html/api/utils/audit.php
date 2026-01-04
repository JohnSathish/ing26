<?php
/**
 * Audit Logging Utility
 * Logs all admin actions for security auditing
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

require_once __DIR__ . '/../config/database.php';

/**
 * Log an action to audit trail
 */
function auditLog($action, $resource, $resourceId = null) {
    try {
        $user = null;
        if (isset($_SESSION['user_id'])) {
            $user = $_SESSION['user_id'];
        }
        
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent)
            VALUES (:user_id, :action, :resource, :ip_address, :user_agent)
        ");
        
        $stmt->execute([
            'user_id' => $user,
            'action' => $action,
            'resource' => $resource . ($resourceId ? ':' . $resourceId : ''),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    } catch (Exception $e) {
        // Don't fail the main operation if audit logging fails
        error_log("Audit log error: " . $e->getMessage());
    }
}


