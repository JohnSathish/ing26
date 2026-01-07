<?php
/**
 * Fetch page from URL and download all images
 * This script attempts to fetch the rendered page and extract images
 */

define('API_ACCESS', true);

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Configuration
$PAGE_URL = $argv[1] ?? 'http://localhost:5173/page/vice-provincial';
$PAGE_SLUG = $argv[2] ?? 'vice-provincial';
$UPLOAD_DIR = __DIR__ . '/public_html/uploads/pages/';
$LOG_FILE = __DIR__ . '/fetch_page_images_log.txt';

// Create upload directory if it doesn't exist
if (!is_dir($UPLOAD_DIR)) {
    mkdir($UPLOAD_DIR, 0755, true);
}

function logMessage($message) {
    global $LOG_FILE;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message\n";
    echo $logEntry;
    file_put_contents($LOG_FILE, $logEntry, FILE_APPEND);
}

function downloadImage($url, $baseUrl, $pageSlug) {
    global $UPLOAD_DIR;
    
    if (empty($url)) {
        return null;
    }
    
    // Skip data URIs
    if (strpos($url, 'data:') === 0) {
        return $url;
    }
    
    // Skip if already local
    if (strpos($url, '/uploads/') !== false) {
        logMessage("Image already local: $url");
        return $url;
    }
    
    // Convert to absolute URL
    $absoluteUrl = $url;
    if (!preg_match('/^https?:\/\//', $url)) {
        $baseParts = parse_url($baseUrl);
        $base = $baseParts['scheme'] . '://' . $baseParts['host'];
        if (isset($baseParts['port'])) {
            $base .= ':' . $baseParts['port'];
        }
        
        if (strpos($url, '/') === 0) {
            $absoluteUrl = $base . $url;
        } else {
            $absoluteUrl = $base . '/' . $url;
        }
    }
    
    try {
        $pathInfo = pathinfo(parse_url($absoluteUrl, PHP_URL_PATH));
        $extension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : 'jpg';
        
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
            logMessage("Skipping non-image: $absoluteUrl");
            return null;
        }
        
        $filename = $pageSlug . '_' . uniqid() . '.' . $extension;
        $filePath = $UPLOAD_DIR . $filename;
        
        $ch = curl_init($absoluteUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        $imageData = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error || $httpCode !== 200 || empty($imageData)) {
            logMessage("Failed to download: $absoluteUrl (HTTP: $httpCode, Error: $error)");
            return null;
        }
        
        if (file_put_contents($filePath, $imageData) === false) {
            logMessage("Failed to save: $filePath");
            return null;
        }
        
        if ($extension !== 'svg') {
            $imageInfo = @getimagesize($filePath);
            if ($imageInfo === false) {
                unlink($filePath);
                logMessage("Invalid image: $filePath");
                return null;
            }
        }
        
        $relativePath = '/uploads/pages/' . $filename;
        logMessage("✓ Downloaded: $url -> $relativePath");
        return $relativePath;
        
    } catch (Exception $e) {
        logMessage("Error: " . $e->getMessage());
        return null;
    }
}

// Main execution
logMessage("Fetching page from: $PAGE_URL");

try {
    $db = Database::getInstance()->getConnection();
    
    // First, try to get page from database
    $stmt = $db->prepare("SELECT id, title, slug, content, featured_image FROM pages WHERE slug = :slug AND deleted_at IS NULL LIMIT 1");
    $stmt->execute(['slug' => $PAGE_SLUG]);
    $page = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $allImages = [];
    $imageMap = [];
    
    // Fetch HTML from URL
    logMessage("Fetching HTML from URL...");
    $ch = curl_init($PAGE_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && $html) {
        logMessage("Fetched HTML (" . strlen($html) . " bytes)");
        
        // Extract all image URLs from HTML
        preg_match_all('/(?:src|href|srcset|background-image:\s*url\(["\']?)=["\']?([^"\'\s<>]+\.(jpg|jpeg|png|gif|webp|svg)(?:\?[^"\']*)?)["\']?/i', $html, $matches);
        if (!empty($matches[1])) {
            $allImages = array_unique($matches[1]);
            logMessage("Found " . count($allImages) . " image URLs in HTML");
        }
        
        // Also check for image URLs in JSON data (React might embed data)
        preg_match_all('/https?:\/\/[^\s"\'<>]+\.(jpg|jpeg|png|gif|webp|svg)/i', $html, $urlMatches);
        if (!empty($urlMatches[0])) {
            $allImages = array_merge($allImages, $urlMatches[0]);
            $allImages = array_unique($allImages);
        }
    }
    
    // Also check API for provincials data
    logMessage("Checking provincials API for images...");
    $apiUrl = "http://localhost:8000/api/provincials/list";
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $apiResponse = curl_exec($ch);
    curl_close($ch);
    
    if ($apiResponse) {
        $apiData = json_decode($apiResponse, true);
        if ($apiData && $apiData['success'] && !empty($apiData['data'])) {
            foreach ($apiData['data'] as $provincial) {
                if ($provincial['title'] === 'vice_provincial' && !empty($provincial['image'])) {
                    $allImages[] = $provincial['image'];
                    logMessage("Found image in API: " . $provincial['image']);
                }
                if (!empty($provincial['bio'])) {
                    // Extract images from bio HTML
                    preg_match_all('/<img[^>]+src=["\']([^"\']+)["\']/i', $provincial['bio'], $bioMatches);
                    if (!empty($bioMatches[1])) {
                        $allImages = array_merge($allImages, $bioMatches[1]);
                    }
                }
            }
        }
    }
    
    $allImages = array_unique($allImages);
    logMessage("Total unique images found: " . count($allImages));
    
    // Download all images
    foreach ($allImages as $imageUrl) {
        $localPath = downloadImage($imageUrl, $PAGE_URL, $PAGE_SLUG);
        if ($localPath) {
            $imageMap[$imageUrl] = $localPath;
        }
    }
    
    // Update database if page exists
    if ($page && !empty($imageMap)) {
        logMessage("Updating page in database...");
        $updatedContent = $page['content'];
        $updatedFeaturedImage = $page['featured_image'];
        
        foreach ($imageMap as $oldUrl => $newPath) {
            if (strpos($updatedContent, $oldUrl) !== false) {
                $updatedContent = str_replace($oldUrl, $newPath, $updatedContent);
            }
            if ($updatedFeaturedImage === $oldUrl) {
                $updatedFeaturedImage = $newPath;
            }
        }
        
        $updateStmt = $db->prepare("UPDATE pages SET content = :content, featured_image = :featured_image, updated_at = NOW() WHERE id = :id");
        $updateStmt->execute([
            'content' => $updatedContent,
            'featured_image' => $updatedFeaturedImage ?: null,
            'id' => $page['id']
        ]);
        logMessage("✓ Updated page in database");
    }
    
    // Update provincials table
    if (!empty($imageMap)) {
        $provincialStmt = $db->prepare("SELECT id, image, bio FROM provincials WHERE title = 'vice_provincial' AND is_current = 1 LIMIT 1");
        $provincialStmt->execute();
        $provincial = $provincialStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($provincial) {
            logMessage("Updating provincial in database...");
            $updatedImage = $provincial['image'];
            $updatedBio = $provincial['bio'];
            
            foreach ($imageMap as $oldUrl => $newPath) {
                if ($updatedImage === $oldUrl) {
                    $updatedImage = $newPath;
                }
                if (!empty($updatedBio) && strpos($updatedBio, $oldUrl) !== false) {
                    $updatedBio = str_replace($oldUrl, $newPath, $updatedBio);
                }
            }
            
            $updateStmt = $db->prepare("UPDATE provincials SET image = :image, bio = :bio, updated_at = NOW() WHERE id = :id");
            $updateStmt->execute([
                'image' => $updatedImage ?: null,
                'bio' => $updatedBio ?: null,
                'id' => $provincial['id']
            ]);
            logMessage("✓ Updated provincial in database");
        }
    }
    
    logMessage("Completed! Downloaded " . count($imageMap) . " images.");
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage());
    logMessage("Stack trace: " . $e->getTraceAsString());
    exit(1);
}

