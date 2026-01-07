<?php
/**
 * Fetch page content from URL and download all images
 * Usage: php fetch_page_images_from_url.php <url> [page_slug]
 * Example: php fetch_page_images_from_url.php http://localhost:5173/page/vice-provincial vice-provincial
 */

define('API_ACCESS', true);

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Configuration
$UPLOAD_DIR = __DIR__ . '/public_html/uploads/pages/';
$LOG_FILE = __DIR__ . '/fetch_page_images_log.txt';

// Get URL from command line
$url = $argv[1] ?? 'http://localhost:5173/page/vice-provincial';
$pageSlug = $argv[2] ?? 'vice-provincial';

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

function fetchUrl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HEADER, false);
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        logMessage("cURL error fetching $url: $error");
        return null;
    }
    
    if ($httpCode !== 200) {
        logMessage("HTTP error $httpCode fetching $url");
        return null;
    }
    
    return $html;
}

function downloadImage($url, $baseUrl, $pageSlug) {
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
        // Parse base URL
        $baseParts = parse_url($baseUrl);
        $baseScheme = $baseParts['scheme'] ?? 'http';
        $baseHost = $baseParts['host'] ?? 'localhost';
        $basePort = isset($baseParts['port']) ? ':' . $baseParts['port'] : '';
        
        if (strpos($url, '/') === 0) {
            // Absolute path
            $url = $baseScheme . '://' . $baseHost . $basePort . $url;
        } else {
            // Relative path
            $basePath = dirname($baseParts['path'] ?? '/');
            $url = $baseScheme . '://' . $baseHost . $basePort . $basePath . '/' . $url;
        }
    }
    
    try {
        // Get file extension
        $pathInfo = pathinfo(parse_url($url, PHP_URL_PATH));
        $extension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : 'jpg';
        
        // Validate extension
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
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
        
        // Verify it's a valid image (skip SVG)
        if ($extension !== 'svg') {
            $imageInfo = @getimagesize($filePath);
            if ($imageInfo === false) {
                logMessage("Invalid image file: $filePath");
                unlink($filePath);
                return null;
            }
        }
        
        $relativePath = '/uploads/pages/' . $filename;
        logMessage("✓ Downloaded image: $url -> $relativePath");
        return $relativePath;
        
    } catch (Exception $e) {
        logMessage("Error downloading image $url: " . $e->getMessage());
        return null;
    }
}

function extractImagesFromHTML($html, $baseUrl) {
    $images = [];
    
    if (empty($html)) {
        return $images;
    }
    
    // Use DOMDocument to parse HTML
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    @$dom->loadHTML($html);
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
            // Parse srcset (format: url1 1x, url2 2x)
            preg_match_all('/([^\s,]+)(?:\s+\d+x)?/i', $srcset, $matches);
            if (!empty($matches[1])) {
                $images = array_merge($images, $matches[1]);
            }
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
    
    // Check for CSS background-image in style tags
    $styleTags = $dom->getElementsByTagName('style');
    foreach ($styleTags as $styleTag) {
        $styleContent = $styleTag->textContent;
        if (preg_match_all('/background-image:\s*url\(["\']?([^"\']+)["\']?\)/i', $styleContent, $matches)) {
            $images = array_merge($images, $matches[1]);
        }
    }
    
    return array_unique($images);
}

// Main execution
logMessage("Starting image download from URL: $url");

try {
    // Fetch HTML from URL
    logMessage("Fetching HTML from URL...");
    $html = fetchUrl($url);
    
    if (!$html) {
        logMessage("Failed to fetch HTML from URL");
        exit(1);
    }
    
    logMessage("Successfully fetched HTML (" . strlen($html) . " bytes)");
    
    // Extract images
    $images = extractImagesFromHTML($html, $url);
    logMessage("Found " . count($images) . " unique images");
    
    $downloadedImages = [];
    $imageMap = []; // Map old URL to new local path
    
    foreach ($images as $imageUrl) {
        logMessage("Processing image: $imageUrl");
        $localPath = downloadImage($imageUrl, $url, $pageSlug);
        if ($localPath) {
            $downloadedImages[] = $localPath;
            $imageMap[$imageUrl] = $localPath;
            logMessage("  -> Saved as: $localPath");
        }
    }
    
    logMessage("Downloaded " . count($downloadedImages) . " images successfully");
    
    // Try to update database if page exists
    $db = Database::getInstance()->getConnection();
    
    // Check for dynamic page
    $pageStmt = $db->prepare("
        SELECT id, title, slug, content, featured_image
        FROM pages
        WHERE slug = :slug AND deleted_at IS NULL
        LIMIT 1
    ");
    $pageStmt->execute(['slug' => $pageSlug]);
    $page = $pageStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($page && !empty($imageMap)) {
        logMessage("Found page in database, updating image references...");
        
        $updatedContent = $page['content'];
        $updatedFeaturedImage = $page['featured_image'];
        $updates = false;
        
        // Update featured image if it was downloaded
        foreach ($imageMap as $oldUrl => $newPath) {
            if ($page['featured_image'] === $oldUrl || strpos($page['featured_image'], $oldUrl) !== false) {
                $updatedFeaturedImage = $newPath;
                $updates = true;
            }
        }
        
        // Update content with new image paths
        foreach ($imageMap as $oldUrl => $newPath) {
            if (strpos($updatedContent, $oldUrl) !== false) {
                $updatedContent = str_replace($oldUrl, $newPath, $updatedContent);
                $updates = true;
            }
        }
        
        if ($updates) {
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
            logMessage("✓ Updated page in database with new image paths");
        }
    }
    
    // Also check provincials table
    $provincialStmt = $db->prepare("
        SELECT id, name, image, bio
        FROM provincials
        WHERE title = 'vice_provincial' AND is_current = 1
        LIMIT 1
    ");
    $provincialStmt->execute();
    $provincial = $provincialStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($provincial && !empty($imageMap)) {
        logMessage("Found Vice Provincial in database, updating image references...");
        
        $updatedImage = $provincial['image'];
        $updatedBio = $provincial['bio'];
        $updates = false;
        
        // Update image if it was downloaded
        foreach ($imageMap as $oldUrl => $newPath) {
            if ($provincial['image'] === $oldUrl || strpos($provincial['image'], $oldUrl) !== false) {
                $updatedImage = $newPath;
                $updates = true;
            }
        }
        
        // Update bio content with new image paths
        if (!empty($provincial['bio'])) {
            foreach ($imageMap as $oldUrl => $newPath) {
                if (strpos($provincial['bio'], $oldUrl) !== false) {
                    $updatedBio = str_replace($oldUrl, $newPath, $updatedBio);
                    $updates = true;
                }
            }
        }
        
        if ($updates) {
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
                'id' => $provincial['id']
            ]);
            logMessage("✓ Updated Vice Provincial in database with new image paths");
        }
    }
    
    logMessage("Completed successfully! Downloaded " . count($downloadedImages) . " images.");
    logMessage("Images saved to: $UPLOAD_DIR");
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage());
    logMessage("Stack trace: " . $e->getTraceAsString());
    exit(1);
}

