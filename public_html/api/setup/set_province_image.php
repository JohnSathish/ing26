<?php
/**
 * One-time script to set the province image
 * Access via: http://localhost:8000/setup/set_province_image.php
 * Or: http://localhost/api/setup/set_province_image.php (if using Vite proxy)
 * 
 * DELETE THIS FILE AFTER USE FOR SECURITY
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';

header('Content-Type: application/json');

// Security: Only allow in development
if (ENVIRONMENT === 'production') {
    http_response_code(403);
    echo json_encode(['error' => 'This script is disabled in production environment.']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();
    
    // The image path
    $imagePath = '/uploads/images/provincial-house.jpg';
    
    // Check if image file exists
    $imageFile = __DIR__ . '/../../uploads/images/provincial-house.jpg';
    if (!file_exists($imageFile)) {
        echo json_encode([
            'error' => 'Image file not found',
            'expected_path' => $imageFile,
            'message' => 'Please ensure the image file exists at: public_html/uploads/images/provincial-house.jpg'
        ]);
        exit;
    }
    
    // Insert or update the setting
    $stmt = $db->prepare("
        INSERT INTO settings (key_name, value, type)
        VALUES (:key_name, :value, :type)
        ON DUPLICATE KEY UPDATE value = :value, type = :type
    ");
    
    $stmt->execute([
        'key_name' => 'province_image',
        'value' => $imagePath,
        'type' => 'text'
    ]);
    
    // Verify it was saved
    $verifyStmt = $db->prepare("SELECT * FROM settings WHERE key_name = 'province_image'");
    $verifyStmt->execute();
    $result = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Province image setting updated successfully!',
        'setting' => $result,
        'image_path' => $imagePath,
        'next_steps' => [
            '1. Refresh your home page to see the image',
            '2. DELETE this file (set_province_image.php) for security',
            '3. The image should now appear in the Welcome section'
        ]
    ]);

} catch (PDOException $e) {
    error_log("Province image update script error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to update province image setting',
        'details' => $e->getMessage(),
        'database' => DB_NAME ?? 'unknown'
    ]);
}
?>

