<?php
/**
 * Update Province Image Setting
 * This script updates the province_image setting in the database
 * Run this once to set the province image URL
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';

header('Content-Type: application/json');

if (ENVIRONMENT === 'production') {
    http_response_code(403);
    echo json_encode(['error' => 'This script is disabled in production environment.']);
    exit;
}

try {
    $db = Database::getInstance()->getConnection();

    // The image URL path
    $imageUrl = '/uploads/images/provincial-house.jpg';

    // Update or insert the setting
    $stmt = $db->prepare("
        INSERT INTO settings (key_name, value, type)
        VALUES ('province_image', :value, 'text')
        ON DUPLICATE KEY UPDATE value = :value, type = 'text'
    ");
    
    $stmt->execute(['value' => $imageUrl]);

    echo json_encode([
        'success' => true,
        'message' => 'Province image setting updated successfully',
        'image_url' => $imageUrl
    ]);

} catch (PDOException $e) {
    error_log("Province image update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update province image setting', 'details' => $e->getMessage()]);
}

