<?php
/**
 * STRENNA - Update Strenna
 */

// Start output buffering to catch any unwanted output
if (!ob_get_level()) {
    ob_start();
} else {
    ob_clean();
}

if (!defined('API_ACCESS')) {
    define('API_ACCESS', true);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/csrf.php';

// Set JSON header early
header('Content-Type: application/json');

// Require authentication
requireAuth();

// Validate CSRF token
validateCSRF();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID parameter required']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $year = sanitizeInput($input['year'] ?? null);
    $title = sanitizeInput($input['title'] ?? null);
    $content = sanitizeInput($input['content'] ?? null);
    $image = isset($input['image']) ? sanitizeInput($input['image']) : null;
    $is_active = isset($input['is_active']) ? (bool)$input['is_active'] : null;
    
    // Build update query dynamically
    $updates = [];
    $params = [];
    
    if ($year !== null) {
        $updates[] = "year = ?";
        $params[] = $year;
    }
    if ($title !== null) {
        $updates[] = "title = ?";
        $params[] = $title;
    }
    if ($content !== null) {
        $updates[] = "content = ?";
        $params[] = $content;
    }
    if ($image !== null) {
        $updates[] = "image = ?";
        $params[] = $image;
    }
    if ($is_active !== null) {
        $updates[] = "is_active = ?";
        $params[] = $is_active ? 1 : 0;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }
    
    $params[] = $id;
    
    $sql = "UPDATE strenna SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() > 0) {
        // Fetch updated record
        $stmt = $db->prepare("SELECT * FROM strenna WHERE id = ?");
        $stmt->execute([$id]);
        $strenna = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $strenna
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'STRENNA not found or no changes made'
        ]);
    }
} catch (PDOException $e) {
    // Suppress any output before JSON
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    // Suppress any output before JSON
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}

