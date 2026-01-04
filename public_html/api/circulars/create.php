<?php
/**
 * Create Circular
 * Admin only
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/csrf.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Require admin
requireAdmin();

// Validate CSRF
validateCSRF();

// Get input
$input = json_decode(file_get_contents('php://input'), true);

$title = sanitizeInput($input['title'] ?? '', 'string');
$month = isset($input['month']) ? intval($input['month']) : 0;
$year = isset($input['year']) ? intval($input['year']) : 0;
$filePath = sanitizeInput($input['file_path'] ?? null, 'string');
$description = sanitizeInput($input['description'] ?? '', 'string');
$isActive = isset($input['is_active']) ? (bool)$input['is_active'] : true;

// Validation
if (empty($title) || $month < 1 || $month > 12 || $year < 2000 || $year > 2100) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid title, month (1-12), and year are required']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // Check if circular for this month/year already exists
    $checkStmt = $db->prepare("SELECT id FROM circulars WHERE year = :year AND month = :month AND deleted_at IS NULL");
    $checkStmt->execute(['year' => $year, 'month' => $month]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Circular for this month and year already exists']);
        exit;
    }
    
    $stmt = $db->prepare("
        INSERT INTO circulars (title, month, year, file_path, description, is_active)
        VALUES (:title, :month, :year, :file_path, :description, :is_active)
    ");
    
    $stmt->execute([
        'title' => $title,
        'month' => $month,
        'year' => $year,
        'file_path' => $filePath,
        'description' => $description,
        'is_active' => $isActive ? 1 : 0
    ]);
    
    $id = $db->lastInsertId();
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('create', 'circular', $id);
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Circular created successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Circular create error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create circular']);
}

