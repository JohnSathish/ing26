<?php
/**
 * STRENNA - Get Single Strenna by ID
 */

// Suppress any output before JSON
if (ob_get_level()) {
    ob_clean();
}

if (!defined('API_ACCESS')) {
    define('API_ACCESS', true);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../middleware/auth.php';

// Set JSON header early
header('Content-Type: application/json');

// Require authentication for admin access
requireAuth();

try {
    $db = Database::getInstance()->getConnection();
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'ID parameter required'
        ]);
        exit;
    }
    
    $stmt = $db->prepare("
        SELECT id, year, title, content, image, is_active, created_at, updated_at
        FROM strenna
        WHERE id = ?
    ");
    
    $stmt->execute([$id]);
    $strenna = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($strenna) {
        // Format image URL
        if ($strenna['image']) {
            $image = $strenna['image'];
            if (strpos($image, 'uploads/') === 0 || strpos($image, '/uploads/') === 0) {
                $strenna['image'] = (strpos($image, '/') === 0 ? '' : '/') . $image;
            } elseif (!preg_match('/^https?:\/\//', $image) && strpos($image, '/') !== 0) {
                $strenna['image'] = '/uploads/images/' . $image;
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => $strenna
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'STRENNA not found'
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}

