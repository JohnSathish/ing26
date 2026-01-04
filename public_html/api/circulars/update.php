<?php
/**
 * Update Circular
 * Admin only
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/csrf.php';

// Only allow PUT/PATCH
if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH'])) {
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
$input = json_decode(file_get_contents('php://input'), true);

if (empty($id)) {
    $id = intval($input['id'] ?? 0);
}

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid ID']);
    exit;
}

// Get input
$title = sanitizeInput($input['title'] ?? null, 'string');
$month = isset($input['month']) ? intval($input['month']) : null;
$year = isset($input['year']) ? intval($input['year']) : null;
$filePath = sanitizeInput($input['file_path'] ?? null, 'string');
$description = sanitizeInput($input['description'] ?? null, 'string');
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : null;

// Build update query
$updates = [];
$params = ['id' => $id];

if ($title !== null) {
    $updates[] = "title = :title";
    $params['title'] = $title;
}

if ($month !== null) {
    if ($month < 1 || $month > 12) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid month']);
        exit;
    }
    $updates[] = "month = :month";
    $params['month'] = $month;
}

if ($year !== null) {
    if ($year < 2000 || $year > 2100) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid year']);
        exit;
    }
    $updates[] = "year = :year";
    $params['year'] = $year;
}

if ($filePath !== null) {
    $updates[] = "file_path = :file_path";
    $params['file_path'] = $filePath;
}

if ($description !== null) {
    $updates[] = "description = :description";
    $params['description'] = $description;
}

if ($isActive !== null) {
    $updates[] = "is_active = :is_active";
    $params['is_active'] = $isActive ? 1 : 0;
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['error' => 'No fields to update']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check for duplicate month/year if updating
    if ($month !== null || $year !== null) {
        $currentStmt = $db->prepare("SELECT month, year FROM circulars WHERE id = :id");
        $currentStmt->execute(['id' => $id]);
        $current = $currentStmt->fetch();
        
        $checkMonth = $month ?? $current['month'];
        $checkYear = $year ?? $current['year'];
        
        $checkStmt = $db->prepare("SELECT id FROM circulars WHERE year = :year AND month = :month AND id != :id AND deleted_at IS NULL");
        $checkStmt->execute(['year' => $checkYear, 'month' => $checkMonth, 'id' => $id]);
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Circular for this month and year already exists']);
            exit;
        }
    }
    
    $sql = "UPDATE circulars SET " . implode(', ', $updates) . " WHERE id = :id AND deleted_at IS NULL";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Circular not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('update', 'circular', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Circular updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Circular update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update circular']);
}

