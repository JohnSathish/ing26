<?php
/**
 * Create Provincial
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

$name = sanitizeInput($input['name'] ?? '', 'string');
$title = sanitizeInput($input['title'] ?? '', 'string');
$image = sanitizeInput($input['image'] ?? null, 'string');
$bio = $input['bio'] ?? '';
$periodStart = $input['period_start'] ?? null;
$periodEnd = $input['period_end'] ?? null;
$isCurrent = isset($input['is_current']) ? (bool)$input['is_current'] : false;
$orderIndex = isset($input['order_index']) ? intval($input['order_index']) : 0;

// Validation
if (empty($name) || empty($title)) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and title are required']);
    exit;
}

if (!in_array($title, ['provincial', 'vice_provincial', 'economer', 'secretary'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid title']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // If setting as current, unset others with same title
    if ($isCurrent) {
        $db->prepare("UPDATE provincials SET is_current = 0 WHERE title = :title")->execute(['title' => $title]);
    }
    
    $stmt = $db->prepare("
        INSERT INTO provincials (name, title, image, bio, period_start, period_end, is_current, order_index)
        VALUES (:name, :title, :image, :bio, :period_start, :period_end, :is_current, :order_index)
    ");
    
    $stmt->execute([
        'name' => $name,
        'title' => $title,
        'image' => $image,
        'bio' => $bio,
        'period_start' => $periodStart,
        'period_end' => $periodEnd,
        'is_current' => $isCurrent ? 1 : 0,
        'order_index' => $orderIndex
    ]);
    
    $id = $db->lastInsertId();
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('create', 'provincial', $id);
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Provincial created successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Provincial create error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create provincial']);
}

