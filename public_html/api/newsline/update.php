<?php
/**
 * Update NewsLine Issue
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
$coverImage = sanitizeInput($input['cover_image'] ?? null, 'string');
$pdfPath = sanitizeInput($input['pdf_path'] ?? null, 'string');
$qrCodeUrl = sanitizeInput($input['qr_code_url'] ?? null, 'string');
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

if ($coverImage !== null) {
    $updates[] = "cover_image = :cover_image";
    $params['cover_image'] = $coverImage;
}

if ($pdfPath !== null) {
    $updates[] = "pdf_path = :pdf_path";
    $params['pdf_path'] = $pdfPath;
}

if ($qrCodeUrl !== null) {
    $updates[] = "qr_code_url = :qr_code_url";
    $params['qr_code_url'] = $qrCodeUrl;
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
        $currentStmt = $db->prepare("SELECT month, year FROM newsline WHERE id = :id");
        $currentStmt->execute(['id' => $id]);
        $current = $currentStmt->fetch();
        
        $checkMonth = $month ?? $current['month'];
        $checkYear = $year ?? $current['year'];
        
        $checkStmt = $db->prepare("SELECT id FROM newsline WHERE year = :year AND month = :month AND id != :id AND deleted_at IS NULL");
        $checkStmt->execute(['year' => $checkYear, 'month' => $checkMonth, 'id' => $id]);
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'NewsLine issue for this month and year already exists']);
            exit;
        }
    }
    
    $sql = "UPDATE newsline SET " . implode(', ', $updates) . " WHERE id = :id AND deleted_at IS NULL";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'NewsLine issue not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('update', 'newsline', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'NewsLine issue updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("NewsLine update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update NewsLine issue']);
}

