<?php
/**
 * Download images from Vice Provincial page
 * Fetches data from API and downloads all referenced images
 */

define('API_ACCESS', true);

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Configuration
$UPLOAD_DIR = __DIR__ . '/public_html/uploads/provincials/';
$LOG_FILE = __DIR__ . '/vice_provincial_download_log.txt';

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

function downloadImage($url, $prefix = 'vice_provincial') {
    global $UPLOAD_DIR;
    
    if (empty($url)) {
        return null;
    }
    
    // Skip if already a local path
    if (strpos($url, '/uploads/') !== false || strpos($url, 'uploads/') === 0) {
        logMessage("Image already local: $url");
        return $url;
    }
    
    // Skip data URIs
    if (strpos($url, 'data:') === 0) {
        logMessage("Skipping data URI: $url");
        return $url;
    }
    
    // Convert relative URLs to absolute
    $absoluteUrl = $url;
    if (!preg_match('/^https?:\/\//', $url)) {
        // If it's a relative URL starting with /
        if (strpos($url, '/') === 0) {
            $absoluteUrl = 'http://localhost:5173' . $url;
        } else {
            $absoluteUrl = 'http://localhost:5173/' . $url;
        }
    }
    
    try {
        // Get file extension
        $pathInfo = pathinfo(parse_url($absoluteUrl, PHP_URL_PATH));
        $extension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : 'jpg';
        
        // Validate extension
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
            logMessage("Invalid image extension: $extension for URL: $url");
            return null;
        }
        
        // Generate unique filename
        $filename = $prefix . '_' . uniqid() . '.' . $extension;
        $filePath = $UPLOAD_DIR . $filename;
        
        // Download image
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
        
        if ($error) {
            logMessage("cURL error downloading $absoluteUrl: $error");
            return null;
        }
        
        if ($httpCode !== 200) {
            logMessage("HTTP error $httpCode downloading $absoluteUrl");
            return null;
        }
        
        if (empty($imageData)) {
            logMessage("Empty image data for $absoluteUrl");
            return null;
        }
        
        // Save image
        if (file_put_contents($filePath, $imageData) === false) {
            logMessage("Failed to save image: $filePath");
            return null;
        }
        
        // Verify it's a valid image (skip SVG)
        if ($extension !== 'svg') {
            $imageInfo = @getimagesize($filePath);
            if ($imageInfo === false) {
                logMessage("Invalid image file: $filePath");
                unlink($filePath);
                return null;
            }
        }
        
        $relativePath = '/uploads/provincials/' . $filename;
        logMessage("✓ Downloaded image: $url -> $relativePath");
        return $relativePath;
        
    } catch (Exception $e) {
        logMessage("Error downloading image $url: " . $e->getMessage());
        return null;
    }
}

function extractImagesFromContent($content) {
    $images = [];
    
    if (empty($content)) {
        return $images;
    }
    
    // Use DOMDocument to parse HTML
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    
    // Find all img tags
    $imgTags = $dom->getElementsByTagName('img');
    foreach ($imgTags as $img) {
        $src = $img->getAttribute('src');
        if (!empty($src)) {
            $images[] = $src;
        }
    }
    
    // Check for background images in style attributes
    $xpath = new DOMXPath($dom);
    $elementsWithStyle = $xpath->query('//*[@style]');
    foreach ($elementsWithStyle as $element) {
        $style = $element->getAttribute('style');
        if (preg_match('/background-image:\s*url\(["\']?([^"\']+)["\']?\)/i', $style, $matches)) {
            $images[] = $matches[1];
        }
    }
    
    return array_unique($images);
}

function replaceImageInContent($content, $oldUrl, $newUrl) {
    if (empty($oldUrl) || empty($newUrl)) {
        return $content;
    }
    
    // Replace in img src attributes
    $content = preg_replace(
        '/(<img[^>]+src=["\'])(' . preg_quote($oldUrl, '/') . ')(["\'][^>]*>)/i',
        '$1' . $newUrl . '$3',
        $content
    );
    
    // Replace in style background-image
    $content = preg_replace(
        '/(background-image:\s*url\(["\']?)(' . preg_quote($oldUrl, '/') . ')(["\']?\))/i',
        '$1' . $newUrl . '$3',
        $content
    );
    
    return $content;
}

// Main execution
logMessage("Starting image download for Vice Provincial");

try {
    $db = Database::getInstance()->getConnection();
    
    // Fetch Vice Provincial from provincials table
    $stmt = $db->prepare("
        SELECT id, name, title, image, bio
        FROM provincials
        WHERE title = 'vice_provincial' AND is_current = 1
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $stmt->execute();
    $viceProvincial = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$viceProvincial) {
        logMessage("Vice Provincial not found. Checking all provincials...");
        
        // Check all provincials
        $allStmt = $db->query("SELECT id, name, title, image, bio FROM provincials");
        $all = $allStmt->fetchAll(PDO::FETCH_ASSOC);
        logMessage("Found " . count($all) . " provincials in database");
        foreach ($all as $p) {
            logMessage("  - {$p['name']} ({$p['title']})");
        }
        
        exit(1);
    }
    
    logMessage("Found Vice Provincial: {$viceProvincial['name']} (ID: {$viceProvincial['id']})");
    logMessage("Profile image: " . ($viceProvincial['image'] ?? 'none'));
    logMessage("Bio length: " . strlen($viceProvincial['bio'] ?? ''));
    
    $updatedImage = $viceProvincial['image'];
    $updatedBio = $viceProvincial['bio'];
    $imagesUpdated = 0;
    
    // Process profile image
    if (!empty($viceProvincial['image'])) {
        logMessage("Processing profile image: {$viceProvincial['image']}");
        $localPath = downloadImage($viceProvincial['image'], 'vice_provincial_profile');
        if ($localPath) {
            $updatedImage = $localPath;
            $imagesUpdated++;
        }
    }
    
    // Extract and download images from bio content
    if (!empty($viceProvincial['bio'])) {
        $images = extractImagesFromContent($viceProvincial['bio']);
        logMessage("Found " . count($images) . " images in bio content");
        
        foreach ($images as $imageUrl) {
            logMessage("Processing image from bio: $imageUrl");
            $localPath = downloadImage($imageUrl, 'vice_provincial_bio');
            if ($localPath) {
                $updatedBio = replaceImageInContent($updatedBio, $imageUrl, $localPath);
                $imagesUpdated++;
            }
        }
    }
    
    // Update provincial in database
    if ($imagesUpdated > 0 || $updatedImage !== $viceProvincial['image'] || $updatedBio !== $viceProvincial['bio']) {
        $updateStmt = $db->prepare("
            UPDATE provincials
            SET image = :image,
                bio = :bio,
                updated_at = NOW()
            WHERE id = :id
        ");
        $updateStmt->execute([
            'image' => $updatedImage ?: null,
            'bio' => $updatedBio ?: null,
            'id' => $viceProvincial['id']
        ]);
        
        logMessage("✓ Updated Vice Provincial with $imagesUpdated downloaded images");
    } else {
        logMessage("No images to update");
    }
    
    // Also check for dynamic page
    $pageStmt = $db->prepare("
        SELECT id, title, slug, content, featured_image
        FROM pages
        WHERE slug = 'vice-provincial' AND deleted_at IS NULL
        LIMIT 1
    ");
    $pageStmt->execute();
    $page = $pageStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($page) {
        logMessage("Found dynamic page: {$page['title']} (ID: {$page['id']})");
        
        $updatedPageContent = $page['content'];
        $updatedPageFeaturedImage = $page['featured_image'];
        $pageImagesUpdated = 0;
        
        // Process page featured image
        if (!empty($page['featured_image'])) {
            logMessage("Processing page featured image: {$page['featured_image']}");
            $localPath = downloadImage($page['featured_image'], 'vice_provincial_page');
            if ($localPath) {
                $updatedPageFeaturedImage = $localPath;
                $pageImagesUpdated++;
            }
        }
        
        // Extract and download images from page content
        $pageImages = extractImagesFromContent($page['content']);
        logMessage("Found " . count($pageImages) . " images in page content");
        
        foreach ($pageImages as $imageUrl) {
            logMessage("Processing image from page content: $imageUrl");
            $localPath = downloadImage($imageUrl, 'vice_provincial_page');
            if ($localPath) {
                $updatedPageContent = replaceImageInContent($updatedPageContent, $imageUrl, $localPath);
                $pageImagesUpdated++;
            }
        }
        
        // Update page in database
        if ($pageImagesUpdated > 0 || $updatedPageContent !== $page['content'] || $updatedPageFeaturedImage !== $page['featured_image']) {
            $updatePageStmt = $db->prepare("
                UPDATE pages
                SET content = :content,
                    featured_image = :featured_image,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $updatePageStmt->execute([
                'content' => $updatedPageContent,
                'featured_image' => $updatedPageFeaturedImage ?: null,
                'id' => $page['id']
            ]);
            logMessage("✓ Updated dynamic page with $pageImagesUpdated downloaded images");
        }
    }
    
    logMessage("Completed successfully! Total images downloaded: " . ($imagesUpdated + ($pageImagesUpdated ?? 0)));
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage());
    logMessage("Stack trace: " . $e->getTraceAsString());
    exit(1);
}

