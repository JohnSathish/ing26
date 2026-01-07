<?php
/**
 * Migrate Provincial Secretary page from WordPress to local site
 * Fetches content from WordPress and creates/updates dynamic page
 */

ini_set('memory_limit', '512M');

define('API_ACCESS', true);

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Configuration
$WORDPRESS_URL = 'https://donboscoguwahati.org/index.php/ing-provincial-secretaries/';
$PAGE_SLUG = 'provincial-secretary';
$UPLOAD_DIR = __DIR__ . '/public_html/uploads/pages/';
$LOG_FILE = __DIR__ . '/provincial_secretary_migration_log.txt';

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
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        logMessage("cURL error: $error");
        return null;
    }
    
    if ($httpCode !== 200) {
        logMessage("HTTP error $httpCode");
        return null;
    }
    
    return $html;
}

function downloadImage($url, $baseUrl, $prefix = 'provincial_secretary') {
    global $UPLOAD_DIR;
    
    if (empty($url)) {
        return null;
    }
    
    // Skip data URIs
    if (strpos($url, 'data:') === 0) {
        return $url;
    }
    
    // Convert relative URLs to absolute
    $absoluteUrl = $url;
    if (!preg_match('/^https?:\/\//', $url)) {
        $baseParts = parse_url($baseUrl);
        $base = $baseParts['scheme'] . '://' . $baseParts['host'];
        
        // Handle WordPress image paths
        if (strpos($url, 'wp-content') !== false || strpos($url, 'wp-includes') !== false) {
            // WordPress relative path
            $absoluteUrl = $base . '/' . ltrim($url, '/');
        } elseif (strpos($url, '/') === 0) {
            $absoluteUrl = $base . $url;
        } else {
            // Try to construct from base URL path
            $basePath = dirname($baseParts['path'] ?? '/');
            $absoluteUrl = $base . $basePath . '/' . $url;
        }
    }
    
    // Remove WordPress size parameters (e.g., -300x200.jpg -> .jpg)
    $absoluteUrl = preg_replace('/-(\d+)x(\d+)\.(jpg|jpeg|png|gif|webp)$/i', '.$3', $absoluteUrl);
    
    try {
        // Get file extension
        $pathInfo = pathinfo(parse_url($absoluteUrl, PHP_URL_PATH));
        $extension = isset($pathInfo['extension']) ? strtolower($pathInfo['extension']) : 'jpg';
        
        // Validate extension
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
            logMessage("Invalid image extension: $extension");
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
        
        $relativePath = '/uploads/pages/' . $filename;
        logMessage("✓ Downloaded image: $url -> $relativePath");
        return $relativePath;
        
    } catch (Exception $e) {
        logMessage("Error downloading image $url: " . $e->getMessage());
        return null;
    }
}

function extractPageContent($html, $baseUrl) {
    if (empty($html)) {
        return null;
    }
    
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    
    // Limit HTML size to prevent memory issues
    if (strlen($html) > 5000000) {
        $html = substr($html, 0, 5000000);
    }
    
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_PARSEHUGE);
    libxml_clear_errors();
    
    $xpath = new DOMXPath($dom);
    
    // Extract title
    $title = '';
    $titleNodes = $xpath->query('//h1[contains(@class, "entry-title")] | //h1[contains(@class, "page-title")] | //h1 | //title');
    if ($titleNodes->length > 0) {
        $title = trim($titleNodes->item(0)->textContent);
    }
    
    // Extract content
    $content = '';
    $contentNodes = $xpath->query('//div[contains(@class, "entry-content")] | //div[contains(@class, "post-content")] | //article | //main');
    
    if ($contentNodes->length > 0) {
        $contentNode = $contentNodes->item(0);
        // Get inner HTML
        $innerHTML = '';
        $children = $contentNode->childNodes;
        foreach ($children as $child) {
            $innerHTML .= $dom->saveHTML($child);
        }
        $content = $innerHTML;
    } else {
        // Fallback: get body content
        $bodyNodes = $xpath->query('//body');
        if ($bodyNodes->length > 0) {
            $body = $bodyNodes->item(0);
            $innerHTML = '';
            $children = $body->childNodes;
            foreach ($children as $child) {
                $innerHTML .= $dom->saveHTML($child);
            }
            $content = $innerHTML;
        }
    }
    
    // Extract featured image - try multiple selectors
    $featuredImage = '';
    $imgSelectors = [
        '//img[contains(@class, "wp-post-image")]',
        '//img[contains(@class, "featured")]',
        '//div[contains(@class, "featured-image")]//img',
        '//div[contains(@class, "post-thumbnail")]//img',
        '//article//img[1]',
        '//img[not(contains(@src, "placeholder"))][not(contains(@src, "blank"))]'
    ];
    
    foreach ($imgSelectors as $selector) {
        $imgNodes = $xpath->query($selector);
        if ($imgNodes->length > 0) {
            $src = $imgNodes->item(0)->getAttribute('src');
            // Skip placeholders
            if (!empty($src) && strpos(strtolower($src), 'placeholder') === false && strpos(strtolower($src), 'blank') === false) {
                $featuredImage = $src;
                break;
            }
        }
    }
    
    // Extract excerpt (first paragraph)
    $excerpt = '';
    $paragraphs = $xpath->query('//p');
    if ($paragraphs->length > 0) {
        $excerpt = trim($paragraphs->item(0)->textContent);
        $excerpt = substr($excerpt, 0, 200); // Limit to 200 chars
    }
    
    return [
        'title' => $title ?: 'Provincial Secretary',
        'content' => $content,
        'featured_image' => $featuredImage,
        'excerpt' => $excerpt
    ];
}

function cleanContent($content, $baseUrl) {
    if (empty($content)) {
        return '';
    }
    
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    
    $xpath = new DOMXPath($dom);
    
    // Remove script and style tags
    $scripts = $xpath->query('//script | //style');
    foreach ($scripts as $script) {
        $script->parentNode->removeChild($script);
    }
    
    // Remove old WordPress links
    $links = $xpath->query('//a[contains(@href, "donboscoguwahati.org")]');
    foreach ($links as $link) {
        $text = $link->textContent;
        $textNode = $dom->createTextNode($text);
        $link->parentNode->replaceChild($textNode, $link);
    }
    
    // Get cleaned HTML
    $body = $dom->getElementsByTagName('body')->item(0);
    if ($body) {
        $innerHTML = '';
        foreach ($body->childNodes as $child) {
            $innerHTML .= $dom->saveHTML($child);
        }
        return $innerHTML;
    }
    
    return $content;
}

function generateSlug($title) {
    $slug = strtolower($title);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

function createOrUpdatePage($data, $slug) {
    global $db;
    
    try {
        // Check if page exists
        $checkStmt = $db->prepare("SELECT id FROM pages WHERE slug = :slug AND deleted_at IS NULL LIMIT 1");
        $checkStmt->execute(['slug' => $slug]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing page
            $updateStmt = $db->prepare("
                UPDATE pages
                SET title = :title,
                    content = :content,
                    excerpt = :excerpt,
                    featured_image = :featured_image,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $updateStmt->execute([
                'title' => $data['title'],
                'content' => $data['content'],
                'excerpt' => $data['excerpt'] ?: null,
                'featured_image' => $data['featured_image'] ?: null,
                'id' => $existing['id']
            ]);
            logMessage("✓ Updated page: {$data['title']} (ID: {$existing['id']})");
            return $existing['id'];
        } else {
            // Create new page
            $insertStmt = $db->prepare("
                INSERT INTO pages (title, slug, content, excerpt, featured_image, is_enabled, show_in_menu, parent_menu, is_submenu, sort_order, created_at, updated_at)
                VALUES (:title, :slug, :content, :excerpt, :featured_image, 1, 0, 'provincials', 1, 0, NOW(), NOW())
            ");
            $insertStmt->execute([
                'title' => $data['title'],
                'slug' => $slug,
                'content' => $data['content'],
                'excerpt' => $data['excerpt'] ?: null,
                'featured_image' => $data['featured_image'] ?: null
            ]);
            $id = $db->lastInsertId();
            logMessage("✓ Created page: {$data['title']} (ID: $id)");
            return $id;
        }
    } catch (PDOException $e) {
        logMessage("Error creating/updating page: " . $e->getMessage());
        return false;
    }
}

// Main execution
logMessage("Starting Provincial Secretary page migration from: $WORDPRESS_URL");

try {
    $db = Database::getInstance()->getConnection();
    
    // Fetch HTML from WordPress
    logMessage("Fetching HTML from WordPress...");
    $html = fetchUrl($WORDPRESS_URL);
    
    if (!$html) {
        logMessage("Failed to fetch HTML");
        exit(1);
    }
    
    logMessage("Successfully fetched HTML (" . strlen($html) . " bytes)");
    
    // Extract content
    logMessage("Extracting content...");
    $pageData = extractPageContent($html, $WORDPRESS_URL);
    
    if (!$pageData) {
        logMessage("Failed to extract content");
        exit(1);
    }
    
    logMessage("Extracted title: {$pageData['title']}");
    logMessage("Content length: " . strlen($pageData['content']));
    
    // Extract all images from content
    $images = [];
    if (!empty($pageData['content'])) {
        preg_match_all('/<img[^>]+src=["\']([^"\']+)["\']/i', $pageData['content'], $matches);
        if (!empty($matches[1])) {
            // Filter out placeholders
            foreach ($matches[1] as $imgUrl) {
                $lowerUrl = strtolower($imgUrl);
                if (strpos($lowerUrl, 'placeholder') === false && 
                    strpos($lowerUrl, 'blank') === false &&
                    strpos($lowerUrl, 'data:') !== 0) {
                    $images[] = $imgUrl;
                }
            }
            $images = array_unique($images);
        }
        
        // Also extract from the full HTML
        preg_match_all('/https?:\/\/[^\s<>"\']+\.(jpg|jpeg|png|gif|webp|svg)(?:\?[^"\']*)?/i', $html, $urlMatches);
        if (!empty($urlMatches[0])) {
            foreach ($urlMatches[0] as $url) {
                $lowerUrl = strtolower($url);
                if (strpos($lowerUrl, 'placeholder') === false && 
                    strpos($lowerUrl, 'blank') === false &&
                    strpos($lowerUrl, 'donboscoguwahati.org') !== false) {
                    $images[] = $url;
                }
            }
            $images = array_unique($images);
        }
    }
    
    // Add featured image if exists
    if (!empty($pageData['featured_image'])) {
        $images[] = $pageData['featured_image'];
    }
    
    logMessage("Found " . count($images) . " images to download");
    
    // Download all images and update URLs
    $imageMap = [];
    foreach ($images as $imageUrl) {
        if (empty($imageUrl)) continue;
        
        logMessage("Downloading image: $imageUrl");
        $localPath = downloadImage($imageUrl, $WORDPRESS_URL, 'provincial_secretary');
        if ($localPath) {
            $imageMap[$imageUrl] = $localPath;
        }
    }
    
    // Update content with local image paths
    $updatedContent = $pageData['content'];
    $updatedFeaturedImage = $pageData['featured_image'];
    
    foreach ($imageMap as $oldUrl => $newPath) {
        // Replace in content
        $updatedContent = str_replace($oldUrl, $newPath, $updatedContent);
        // Replace in featured image
        if ($updatedFeaturedImage === $oldUrl) {
            $updatedFeaturedImage = $newPath;
        }
    }
    
    // Clean content
    $updatedContent = cleanContent($updatedContent, $WORDPRESS_URL);
    
    // Create or update page
    $pageData['content'] = $updatedContent;
    $pageData['featured_image'] = $updatedFeaturedImage;
    
    $pageId = createOrUpdatePage($pageData, $PAGE_SLUG);
    
    if ($pageId) {
        logMessage("✓ Migration completed successfully!");
        logMessage("Page available at: http://localhost:5173/page/$PAGE_SLUG");
        logMessage("Downloaded " . count($imageMap) . " images");
    } else {
        logMessage("Failed to create/update page");
        exit(1);
    }
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage());
    logMessage("Stack trace: " . $e->getTraceAsString());
    exit(1);
}

