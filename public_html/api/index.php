<?php
/**
 * API Router
 * Routes requests to appropriate endpoints
 */

if (!defined('API_ACCESS')) {
    define('API_ACCESS', true);
}

// Load constants to check environment
require_once __DIR__ . '/config/constants.php';

// CORS - Same origin only (allow localhost for development)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = $_SERVER['HTTP_HOST'] ?? '';

// Allow localhost for development
if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
    if ($origin && (strpos($origin, 'http://localhost') === 0 || strpos($origin, 'http://127.0.0.1') === 0)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Requested-With');
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }
} else {
    // Production: strict same-origin
    if ($origin && parse_url($origin, PHP_URL_HOST) !== parse_url($allowedOrigin, PHP_URL_HOST)) {
        http_response_code(403);
        exit('CORS policy violation');
    }
}

// Set JSON response header
header('Content-Type: application/json');

// Get request path
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove base path - handle both /api/index.php and /api/ routing
$basePath = dirname($scriptName);
if ($basePath !== '/' && $basePath !== '.') {
    // Remove the base path from the request URI
    if (strpos($path, $basePath) === 0) {
        $path = substr($path, strlen($basePath));
    }
}

// Also handle direct /api/ requests
if (strpos($path, '/api/') === 0) {
    $path = substr($path, 5); // Remove '/api/'
}

$path = trim($path, '/');
$pathParts = array_filter(explode('/', $path));
$pathParts = array_values($pathParts);

// Route to appropriate endpoint
$endpoint = $pathParts[0] ?? '';

switch ($endpoint) {
    case 'auth':
        $file = __DIR__ . '/auth/' . ($pathParts[1] ?? 'check') . '.php';
        break;
    
    case 'admin':
        $action = $pathParts[1] ?? '';
        if ($action === 'update-credentials') {
            $file = __DIR__ . '/admin/update-credentials.php';
        } elseif ($action === 'create-user') {
            $file = __DIR__ . '/admin/create-user.php';
        } elseif ($action === 'list-users') {
            $file = __DIR__ . '/admin/list-users.php';
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Admin endpoint not found']);
            exit;
        }
        break;
    
    case 'dashboard':
        $file = __DIR__ . '/dashboard/' . ($pathParts[1] ?? 'stats') . '.php';
        break;
    
    case 'birthday':
        $file = __DIR__ . '/birthday/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'news':
        $action = $pathParts[1] ?? 'list';
        if ($action === 'get' || $action === 'list' || $action === 'create' || $action === 'update' || $action === 'delete') {
            $file = __DIR__ . '/news/' . $action . '.php';
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'News endpoint not found']);
            exit;
        }
        break;
    
    case 'messages':
        $file = __DIR__ . '/messages/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'houses':
        $file = __DIR__ . '/houses/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'banners':
        $file = __DIR__ . '/banners/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'circulars':
        $file = __DIR__ . '/circulars/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'newsline':
        $file = __DIR__ . '/newsline/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'gallery':
        $file = __DIR__ . '/gallery/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'photo_galleries':
    case 'photo-galleries':
        $action = $pathParts[1] ?? 'list';
        if (in_array($action, ['list', 'create', 'update', 'delete'])) {
            $file = __DIR__ . '/photo_galleries/' . $action . '.php';
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Photo galleries endpoint not found']);
            exit;
        }
        break;
    
    case 'video_galleries':
    case 'video-galleries':
        $action = $pathParts[1] ?? 'list';
        if (in_array($action, ['list', 'create', 'update', 'delete'])) {
            $file = __DIR__ . '/video_galleries/' . $action . '.php';
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Video galleries endpoint not found']);
            exit;
        }
        break;
    
    case 'provincials':
        $file = __DIR__ . '/provincials/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'council':
        $file = __DIR__ . '/council/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'commissions':
        $file = __DIR__ . '/commissions/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'quick-links':
        $file = __DIR__ . '/quick_links/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'collaborations':
        $file = __DIR__ . '/collaborations/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'settings':
        $file = __DIR__ . '/settings/' . ($pathParts[1] ?? 'get') . '.php';
        break;
    
    case 'strenna':
        $file = __DIR__ . '/strenna/' . ($pathParts[1] ?? 'list') . '.php';
        break;
    
    case 'pages':
        $action = $pathParts[1] ?? 'list';
        if ($action === 'get' || $action === 'list' || $action === 'create' || $action === 'update' || $action === 'delete') {
            $file = __DIR__ . '/pages/' . $action . '.php';
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Pages endpoint not found']);
            exit;
        }
        break;
    
    case 'upload':
        if (($pathParts[1] ?? '') === 'image') {
            $file = __DIR__ . '/upload/image.php';
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Upload endpoint not found']);
            exit;
        }
        break;
    
    case 'visitor':
        $file = __DIR__ . '/visitor/' . ($pathParts[1] ?? 'increment') . '.php';
        break;
    
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        exit;
}

if (file_exists($file)) {
    require_once $file;
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}

