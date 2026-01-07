<?php
/**
 * Download images from a dynamic page and store them locally
 * Usage: php download_page_images.php <page_slug>
 * Example: php download_page_images.php vice-provincial
 */

// Bypass API_ACCESS check for CLI
define('API_ACCESS', true);

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Configuration
$UPLOAD_DIR = __DIR__ . '/public_html/uploads/pages/';
$LOG_FILE = __DIR__ . '/download_images_log.txt';

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

function downloadImage($url, $pageSlug) {
    global $UPLOAD_DIR;
    
    if (empty($url)) {
        return null;
    }
    
    // Skip if already a local path
    if (strpos($url, '/uploads/') !== false || strpos($url, 'uploads/') === 0) {
        logMessage("Image already local: $url");
        return $url;
    }
    
    // Convert relative URLs to absolute
    if (!preg_match('/^https?:\/\//', $url)) {
        // If it's a relative URL, we need the base URL
        if (strpos($url, '/') === 0) {
            $url = 'http://localhost:5173' . $url;
        } else {
            $url = 'http://localhost:5173/' . $url;
        }
    }
    
    try {
        // Get file extension
        $pathInfo = pathinfo(parse_url($url, PHP_URL_PATH));
        $extension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : 'jpg';
        
        // Validate extension
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            logMessage("Invalid image extension: $extension for URL: $url");
            return null;
        }
        
        // Generate unique filename
        $filename = $pageSlug . '_' . uniqid() . '.' . $extension;
        $filePath = $UPLOAD_DIR . $filename;
        
        // Download image
        $ch = curl_init($url);
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
            logMessage("cURL error downloading $url: $error");
            return null;
        }
        
        if ($httpCode !== 200) {
            logMessage("HTTP error $httpCode downloading $url");
            return null;
        }
        
        if (empty($imageData)) {
            logMessage("Empty image data for $url");
            return null;
        }
        
        // Save image
        if (file_put_contents($filePath, $imageData) === false) {
            logMessage("Failed to save image: $filePath");
            return null;
        }
        
        // Verify it's a valid image
        $imageInfo = @getimagesize($filePath);
        if ($imageInfo === false) {
            logMessage("Invalid image file: $filePath");
            unlink($filePath);
            return null;
        }
        
        $relativePath = '/uploads/pages/' . $filename;
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
    
    // Also extract from plain text URLs (for external URLs in content)
    preg_match_all('/https?:\/\/[^\s<>"\']+\.(jpg|jpeg|png|gif|webp|svg)/i', $content, $urlMatches);
    if (!empty($urlMatches[0])) {
        $images = array_merge($images, $urlMatches[0]);
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
        
        // Also check srcset
        $srcset = $img->getAttribute('srcset');
        if (!empty($srcset)) {
            preg_match_all('/([^\s,]+\.(jpg|jpeg|png|gif|webp|svg))/i', $srcset, $matches);
            if (!empty($matches[1])) {
                $images = array_merge($images, $matches[1]);
            }
        }
    }
    
    // Also check for background images in style attributes
    $xpath = new DOMXPath($dom);
    $elementsWithStyle = $xpath->query('//*[@style]');
    foreach ($elementsWithStyle as $element) {
        $style = $element->getAttribute('style');
        if (preg_match('/background-image:\s*url\(["\']?([^"\']+)["\']?\)/i', $style, $matches)) {
            $images[] = $matches[1];
        }
    }
    
    // Check for image URLs in href attributes (linked images)
    $links = $dom->getElementsByTagName('a');
    foreach ($links as $link) {
        $href = $link->getAttribute('href');
        if (!empty($href) && preg_match('/\.(jpg|jpeg|png|gif|webp|svg)$/i', $href)) {
            $images[] = $href;
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
$pageSlug = $argv[1] ?? 'vice-provincial';

logMessage("Starting image download for page: $pageSlug");

try {
    $db = Database::getInstance()->getConnection();
    
    // Fetch page from database
    $stmt = $db->prepare("
        SELECT id, title, slug, content, featured_image
        FROM pages
        WHERE slug = :slug AND deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute(['slug' => $pageSlug]);
    $page = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$page) {
        logMessage("Page not found: $pageSlug");
        exit(1);
    }
    
    logMessage("Found page: {$page['title']} (ID: {$page['id']})");
    
    $updatedContent = $page['content'];
    $updatedFeaturedImage = $page['featured_image'];
    $imagesUpdated = 0;
    
    // Process featured image
    if (!empty($page['featured_image'])) {
        logMessage("Processing featured image: {$page['featured_image']}");
        $localPath = downloadImage($page['featured_image'], $pageSlug);
        if ($localPath) {
            $updatedFeaturedImage = $localPath;
            $imagesUpdated++;
        }
    }
    
    // Extract and download images from content
    $images = extractImagesFromContent($page['content']);
    logMessage("Found " . count($images) . " images in content");
    
    if (count($images) > 0) {
        logMessage("Image URLs found: " . implode(', ', $images));
    } else {
        logMessage("No images found in content. Content preview: " . substr($page['content'], 0, 200));
    }
    
    foreach ($images as $imageUrl) {
        logMessage("Processing image: $imageUrl");
        $localPath = downloadImage($imageUrl, $pageSlug);
        if ($localPath) {
            $updatedContent = replaceImageInContent($updatedContent, $imageUrl, $localPath);
            $imagesUpdated++;
        }
    }
    
    // Also check if content contains external URLs that might be images
    if (empty($images) && !empty($page['content'])) {
        // Look for any URLs in the content
        preg_match_all('/https?:\/\/[^\s<>"\']+/i', $page['content'], $urlMatches);
        if (!empty($urlMatches[0])) {
            logMessage("Found " . count($urlMatches[0]) . " URLs in content (checking if any are images)...");
            foreach ($urlMatches[0] as $url) {
                if (preg_match('/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i', $url)) {
                    logMessage("Found potential image URL: $url");
                    $localPath = downloadImage($url, $pageSlug);
                    if ($localPath) {
                        $updatedContent = str_replace($url, $localPath, $updatedContent);
                        $imagesUpdated++;
                    }
                }
            }
        }
    }
    
    // Update page in database
    if ($imagesUpdated > 0 || $updatedContent !== $page['content'] || $updatedFeaturedImage !== $page['featured_image']) {
        $updateStmt = $db->prepare("
            UPDATE pages
            SET content = :content,
                featured_image = :featured_image,
                updated_at = NOW()
            WHERE id = :id
        ");
        $updateStmt->execute([
            'content' => $updatedContent,
            'featured_image' => $updatedFeaturedImage ?: null,
            'id' => $page['id']
        ]);
        
        logMessage("✓ Updated page with $imagesUpdated downloaded images");
    } else {
        logMessage("No images to update");
    }
    
    logMessage("Completed successfully!");
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage());
    exit(1);
}

