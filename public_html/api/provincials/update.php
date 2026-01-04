<?php
/**
 * Update Provincial
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
$name = sanitizeInput($input['name'] ?? null, 'string');
$title = sanitizeInput($input['title'] ?? null, 'string');
$image = sanitizeInput($input['image'] ?? null, 'string');
$bio = $input['bio'] ?? null;
$periodStart = $input['period_start'] ?? null;
$periodEnd = $input['period_end'] ?? null;
$isCurrent = isset($input['is_current']) ? (bool)$input['is_current'] : null;
$orderIndex = isset($input['order_index']) ? intval($input['order_index']) : null;

// Build update query
$updates = [];
$params = ['id' => $id];

if ($name !== null) {
    $updates[] = "name = :name";
    $params['name'] = $name;
}

if ($title !== null) {
    if (!in_array($title, ['provincial', 'vice_provincial', 'economer', 'secretary'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid title']);
        exit;
    }
    $updates[] = "title = :title";
    $params['title'] = $title;
}

if ($image !== null) {
    $updates[] = "image = :image";
    $params['image'] = $image;
}

if ($bio !== null) {
    $updates[] = "bio = :bio";
    $params['bio'] = $bio;
}

if ($periodStart !== null) {
    $updates[] = "period_start = :period_start";
    $params['period_start'] = $periodStart;
}

if ($periodEnd !== null) {
    $updates[] = "period_end = :period_end";
    $params['period_end'] = $periodEnd;
}

if ($isCurrent !== null) {
    $updates[] = "is_current = :is_current";
    $params['is_current'] = $isCurrent ? 1 : 0;
    
    // If setting as current, unset others with same title
    if ($isCurrent) {
        $currentTitle = $title;
        if ($currentTitle === null) {
            $currentStmt = $db->prepare("SELECT title FROM provincials WHERE id = :id");
            $currentStmt->execute(['id' => $id]);
            $current = $currentStmt->fetch();
            $currentTitle = $current['title'];
        }
        $db->prepare("UPDATE provincials SET is_current = 0 WHERE title = :title AND id != :id")
           ->execute(['title' => $currentTitle, 'id' => $id]);
    }
}

if ($orderIndex !== null) {
    $updates[] = "order_index = :order_index";
    $params['order_index'] = $orderIndex;
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['error' => 'No fields to update']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $sql = "UPDATE provincials SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Provincial not found']);
        exit;
    }
    
    // Log action
    require_once __DIR__ . '/../utils/audit.php';
    auditLog('update', 'provincial', $id);
    
    echo json_encode([
        'success' => true,
        'message' => 'Provincial updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Provincial update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update provincial']);
}

