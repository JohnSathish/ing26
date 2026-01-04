<?php
/**
 * Router script for PHP built-in server
 * Routes all requests to index.php
 */

// Get the request URI
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove query string for routing
$path = strtok($path, '?');

// If it's a file request (has extension), check if it exists in current directory
if (preg_match('/\.(php|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$/i', $path)) {
    $filePath = __DIR__ . $path;
    if (file_exists($filePath) && is_file($filePath)) {
        return false; // Serve the file directly
    }
}

// Handle uploads directory - serve images directly
if (strpos($path, '/uploads/') === 0) {
    $filePath = __DIR__ . '/..' . $path;
    if (file_exists($filePath) && is_file($filePath)) {
        // Set appropriate content type
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
        ];
        if (isset($mimeTypes[$extension])) {
            header('Content-Type: ' . $mimeTypes[$extension]);
        }
        readfile($filePath);
        exit;
    }
}

// Remove /api prefix if present (Vite proxy sends /api/* requests)
if (strpos($path, '/api/') === 0) {
    $path = substr($path, 5); // Remove '/api/'
} elseif ($path === '/api') {
    $path = '';
}

// Set up environment for index.php
$_SERVER['SCRIPT_NAME'] = '/api/index.php';
$_SERVER['REQUEST_URI'] = '/api/' . ltrim($path, '/');

// Route to index.php
chdir(__DIR__);

// Don't define API_ACCESS here - let index.php handle it
require __DIR__ . '/index.php';

