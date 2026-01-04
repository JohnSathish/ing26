<?php
/**
 * Delete Commission
 * Admin only
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/csrf.php';

// Only allow DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Require admin
requireAdmin();

// Validate CSRF
validateCSRF();

// Get ID
$id = intval($_GET['id'] ?? 0);

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid ID']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Hard delete
    $stmt = $db->prepare("DELETE FROM commissions WHERE id = :id");
    $stmt->execute(['id' => $id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Commission not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('delete', 'commission', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Commission deleted successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Commission delete error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete commission']);
}

