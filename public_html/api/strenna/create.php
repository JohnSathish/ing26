<?php
/**
 * STRENNA - Create New Strenna
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $year = sanitizeInput($input['year'] ?? '2025');
    $title = sanitizeInput($input['title'] ?? '');
    $content = sanitizeInput($input['content'] ?? '');
    $image = sanitizeInput($input['image'] ?? null);
    $is_active = isset($input['is_active']) ? (bool)$input['is_active'] : true;
    
    if (empty($title) || empty($content)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Title and content are required'
        ]);
        exit;
    }
    
    // Deactivate all other STRENNA entries for the same year
    $stmt = $db->prepare("UPDATE strenna SET is_active = 0 WHERE year = ?");
    $stmt->execute([$year]);
    
    // Insert new STRENNA
    $stmt = $db->prepare("
        INSERT INTO strenna (year, title, content, image, is_active)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $year,
        $title,
        $content,
        $image,
        $is_active ? 1 : 0
    ]);
    
    $id = $db->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $id,
            'year' => $year,
            'title' => $title,
            'content' => $content,
            'image' => $image,
            'is_active' => $is_active
        ]
    ]);
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

