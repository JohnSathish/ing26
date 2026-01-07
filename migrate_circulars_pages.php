<?php
/**
 * Migrate Circulars Content and Submenu Data from WordPress
 * Scrapes Circulars section from old WordPress site and creates dynamic pages
 */

// Increase memory limit
ini_set('memory_limit', '1024M');

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/security.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Configuration
$WORDPRESS_BASE_URL = 'https://donboscoguwahati.org';
$CIRCULARS_URL = $WORDPRESS_BASE_URL . '/index.php/provincial-circular/';
$UPLOAD_DIR = __DIR__ . '/public_html/uploads/circulars/';
$LOG_FILE = __DIR__ . '/circulars_migration_log.txt';

// Create upload directory if it doesn't exist
if (!file_exists($UPLOAD_DIR)) {
    mkdir($UPLOAD_DIR, 0755, true);
}

// Initialize log
$log = fopen($LOG_FILE, 'w');
function logMessage($message) {
    global $log;
    $timestamp = date('Y-m-d H:i:s');
    fwrite($log, "[$timestamp] $message\n");
    echo "[$timestamp] $message\n";
}

/**
 * Fetch HTML content from URL
 */
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
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Failed to fetch URL: $url (HTTP $httpCode)");
    }
    
    return $html;
}

/**
 * Download file from URL and save locally
 */
function downloadFile($url, $localPath) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    $data = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Failed to download file: $url (HTTP $httpCode)");
    }
    
    file_put_contents($localPath, $data);
    return true;
}

/**
 * Generate URL-friendly slug
 */
function generateSlug($text) {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9-]/', '-', $text);
    $text = preg_replace('/-+/', '-', $text);
    return trim($text, '-');
}

/**
 * Extract Circulars menu items from WordPress navigation
 */
function extractCircularsMenuItems($html) {
    // Limit HTML size to prevent memory issues
    if (strlen($html) > 5000000) { // 5MB limit
        $html = substr($html, 0, 5000000);
    }
    
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'), LIBXML_PARSEHUGE);
    libxml_clear_errors();
    $xpath = new DOMXPath($dom);
    
    $menuItems = [];
    $seenUrls = [];
    $seenTitles = [];
    
    // Look for Circulars menu items - typically year-based (e.g., "CIRCULARS 2025", "CIRCULARS 2024")
    // Check navigation menu for links containing "circular" and year pattern
    $circularLinks = $xpath->query("//a[contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'CIRCULAR')]");
    
    foreach ($circularLinks as $link) {
        $href = $link->getAttribute('href');
        $text = trim($link->textContent);
        
        // Check if it matches "CIRCULARS YYYY" pattern
        if (preg_match('/CIRCULARS?\s+(\d{4})/i', $text, $matches)) {
            $year = $matches[1];
            $title = "CIRCULARS $year";
            
            // Make absolute URL if relative
            if (!empty($href) && strpos($href, 'http') !== 0) {
                $href = 'https://donboscoguwahati.org' . $href;
            }
            
            // Skip external links
            if (strpos($href, 'donboscoguwahati.org') === false) {
                continue;
            }
            
            // Check for duplicates
            $key = strtolower($title);
            if (!isset($seenTitles[$key]) && !isset($seenUrls[$href])) {
                $seenTitles[$key] = true;
                $seenUrls[$href] = true;
                
                $menuItems[] = [
                    'title' => $title,
                    'url' => $href,
                    'slug' => generateSlug($title),
                    'year' => intval($year)
                ];
            }
        }
    }
    
    // Also look for year links in content areas
    $yearLinks = $xpath->query("//a[contains(@href, 'circular') and (contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '2025') or contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '2024') or contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '2023') or contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '2022') or contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '2021') or contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '2020') or contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '2019'))]");
    
    foreach ($yearLinks as $link) {
        $href = $link->getAttribute('href');
        $text = trim($link->textContent);
        
        // Extract year from text or URL
        if (preg_match('/(\d{4})/', $text, $matches) || preg_match('/(\d{4})/', $href, $matches)) {
            $year = $matches[1];
            $title = "CIRCULARS $year";
            
            // Make absolute URL if relative
            if (!empty($href) && strpos($href, 'http') !== 0) {
                $href = 'https://donboscoguwahati.org' . $href;
            }
            
            // Skip external links
            if (strpos($href, 'donboscoguwahati.org') === false) {
                continue;
            }
            
            // Check for duplicates
            $key = strtolower($title);
            if (!isset($seenTitles[$key]) && !isset($seenUrls[$href])) {
                $seenTitles[$key] = true;
                $seenUrls[$href] = true;
                
                $menuItems[] = [
                    'title' => $title,
                    'url' => $href,
                    'slug' => generateSlug($title),
                    'year' => intval($year)
                ];
            }
        }
    }
    
    // Sort by year (newest first)
    usort($menuItems, function($a, $b) {
        return $b['year'] - $a['year'];
    });
    
    return $menuItems;
}

/**
 * Extract Circulars content from a page
 */
function extractCircularsContent($html, $url) {
    // Limit HTML size
    if (strlen($html) > 5000000) {
        $html = substr($html, 0, 5000000);
    }
    
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'), LIBXML_PARSEHUGE);
    libxml_clear_errors();
    $xpath = new DOMXPath($dom);
    
    $content = [
        'title' => '',
        'content' => '',
        'excerpt' => '',
        'featured_image' => null,
        'pdf_url' => null,
        'images' => []
    ];
    
    // Extract title
    $titleNodes = $xpath->query("//h1 | //h2[contains(@class, 'title')] | //title");
    if ($titleNodes->length > 0) {
        $content['title'] = trim($titleNodes->item(0)->textContent);
    }
    
    // Extract main content
    $contentNodes = $xpath->query("//div[contains(@class, 'content')] | //div[contains(@class, 'post-content')] | //article | //main");
    if ($contentNodes->length > 0) {
        $contentNode = $contentNodes->item(0);
        $content['content'] = $dom->saveHTML($contentNode);
    } else {
        // Fallback: get body content
        $bodyNodes = $xpath->query("//body");
        if ($bodyNodes->length > 0) {
            $content['content'] = $dom->saveHTML($bodyNodes->item(0));
        }
    }
    
    // Extract PDF links
    $pdfLinks = $xpath->query("//a[contains(@href, '.pdf')]");
    if ($pdfLinks->length > 0) {
        $pdfUrl = $pdfLinks->item(0)->getAttribute('href');
        if (!empty($pdfUrl) && strpos($pdfUrl, 'http') !== 0) {
            $pdfUrl = 'https://donboscoguwahati.org' . $pdfUrl;
        }
        $content['pdf_url'] = $pdfUrl;
    }
    
    // Extract images
    $images = $xpath->query("//img[@src]");
    foreach ($images as $img) {
        $imgSrc = $img->getAttribute('src');
        if (!empty($imgSrc) && strpos($imgSrc, 'http') !== 0) {
            $imgSrc = 'https://donboscoguwahati.org' . $imgSrc;
        }
        if (!in_array($imgSrc, $content['images'])) {
            $content['images'][] = $imgSrc;
        }
    }
    
    // Extract excerpt (first paragraph or first 200 chars)
    if (!empty($content['content'])) {
        $text = strip_tags($content['content']);
        $content['excerpt'] = substr($text, 0, 200);
    }
    
    return $content;
}

/**
 * Download image and return local path
 */
function downloadImage($url, $filename) {
    global $UPLOAD_DIR;
    
    if (empty($url)) {
        return null;
    }
    
    try {
        $extension = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION);
        if (empty($extension)) {
            $extension = 'jpg';
        }
        $extension = strtolower($extension);
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $extension = 'jpg';
        }
        
        $localFilename = $filename . '.' . $extension;
        $localPath = $UPLOAD_DIR . $localFilename;
        
        if (file_exists($localPath)) {
            logMessage("Image already exists: $localFilename");
            return '/uploads/circulars/' . $localFilename;
        }
        
        downloadFile($url, $localPath);
        logMessage("Downloaded image: $localFilename");
        return '/uploads/circulars/' . $localFilename;
    } catch (Exception $e) {
        logMessage("Failed to download image: $url - " . $e->getMessage());
        return null;
    }
}

/**
 * Download PDF and return local path
 */
function downloadPDF($url, $slug) {
    global $UPLOAD_DIR;
    
    if (empty($url)) {
        return null;
    }
    
    try {
        $filename = $slug . '.pdf';
        $localPath = $UPLOAD_DIR . $filename;
        
        if (file_exists($localPath)) {
            logMessage("PDF already exists: $filename");
            return '/uploads/circulars/' . $filename;
        }
        
        downloadFile($url, $localPath);
        logMessage("Downloaded PDF: $filename");
        return '/uploads/circulars/' . $filename;
    } catch (Exception $e) {
        logMessage("Failed to download PDF: $url - " . $e->getMessage());
        return null;
    }
}

/**
 * Clean HTML content
 */
function cleanContent($html) {
    // Remove old WordPress links
    $html = preg_replace('/<a[^>]*href=["\']https?:\/\/donboscoguwahati\.org[^"\']*["\'][^>]*>(.*?)<\/a>/is', '$1', $html);
    
    // Remove script and style tags
    $html = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/is', '', $html);
    $html = preg_replace('/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/is', '', $html);
    
    return $html;
}

/**
 * Create a page in the database
 */
function createPage($data) {
    global $db;
    
    try {
        // Check if page already exists
        $checkStmt = $db->prepare("SELECT id FROM pages WHERE slug = :slug AND deleted_at IS NULL");
        $checkStmt->execute(['slug' => $data['slug']]);
        if ($checkStmt->fetch()) {
            logMessage("Page already exists: {$data['slug']}");
            return false;
        }
        
        $stmt = $db->prepare("
            INSERT INTO pages (
                title, slug, content, excerpt, meta_title, meta_description, 
                featured_image, menu_label, menu_position, parent_menu, 
                is_submenu, is_enabled, is_featured, show_in_menu, sort_order
            ) VALUES (
                :title, :slug, :content, :excerpt, :meta_title, :meta_description,
                :featured_image, :menu_label, :menu_position, :parent_menu,
                :is_submenu, :is_enabled, :is_featured, :show_in_menu, :sort_order
            )
        ");
        
        $stmt->execute([
            'title' => $data['title'],
            'slug' => $data['slug'],
            'content' => $data['content'],
            'excerpt' => $data['excerpt'] ?: substr(strip_tags($data['content']), 0, 200),
            'meta_title' => $data['title'],
            'meta_description' => $data['excerpt'] ?: substr(strip_tags($data['content']), 0, 160),
            'featured_image' => $data['featured_image'],
            'menu_label' => $data['menu_label'] ?: $data['title'],
            'menu_position' => $data['sort_order'],
            'parent_menu' => $data['parent_menu'] ?: null,
            'is_submenu' => isset($data['is_submenu']) ? ($data['is_submenu'] ? 1 : 0) : 0,
            'is_enabled' => 1,
            'is_featured' => 0,
            'show_in_menu' => isset($data['show_in_menu']) ? ($data['show_in_menu'] ? 1 : 0) : 1,
            'sort_order' => $data['sort_order']
        ]);
        
        $id = $db->lastInsertId();
        logMessage("Created page: {$data['title']} (ID: $id)");
        return $id;
    } catch (PDOException $e) {
        logMessage("Error creating page {$data['title']}: " . $e->getMessage());
        return false;
    }
}

// Main migration process
try {
    logMessage("Starting Circulars migration...");
    
    $db = Database::getInstance()->getConnection();
    
    // Fetch main Circulars page
    logMessage("Fetching main Circulars page: $CIRCULARS_URL");
    $html = fetchUrl($CIRCULARS_URL);
    
    // Extract menu items
    logMessage("Extracting Circulars menu items...");
    $menuItems = extractCircularsMenuItems($html);
    logMessage("Found " . count($menuItems) . " Circulars menu items");
    
    $sortOrder = 1;
    
    // Process each menu item
    foreach ($menuItems as $menuItem) {
        logMessage("Processing: {$menuItem['title']} - {$menuItem['url']}");
        
        try {
            // Fetch the page content
            $pageHtml = fetchUrl($menuItem['url']);
            $content = extractCircularsContent($pageHtml, $menuItem['url']);
            
            // Use extracted title or fallback to menu item title
            $title = !empty($content['title']) ? $content['title'] : $menuItem['title'];
            $slug = $menuItem['slug'];
            
            // Download featured image
            $featuredImage = null;
            if (!empty($content['featured_image'])) {
                $featuredImage = downloadImage($content['featured_image'], $slug);
            }
            
            // Download PDF if available
            $pdfPath = null;
            if (!empty($content['pdf_url'])) {
                $pdfPath = downloadPDF($content['pdf_url'], $slug);
                // Add PDF link to content if not already present
                if ($pdfPath && strpos($content['content'], $pdfPath) === false) {
                    $content['content'] .= '<p><a href="' . $pdfPath . '" target="_blank" class="pdf-download-btn" style="display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Download/View PDF</a></p>';
                }
            }
            
            // Download and update image URLs in content
            if (!empty($content['images'])) {
                foreach ($content['images'] as $imgUrl) {
                    $localImgPath = downloadImage($imgUrl, $slug . '-' . md5($imgUrl));
                    if ($localImgPath) {
                        $content['content'] = str_replace($imgUrl, $localImgPath, $content['content']);
                    }
                }
            }
            
            // Clean content
            $content['content'] = cleanContent($content['content']);
            
            // Create page data
            $pageData = [
                'title' => $title,
                'slug' => $slug,
                'content' => $content['content'],
                'excerpt' => $content['excerpt'],
                'featured_image' => $featuredImage,
                'menu_label' => $menuItem['title'],
                'parent_menu' => 'circulars',
                'is_submenu' => true,
                'show_in_menu' => true,
                'sort_order' => $sortOrder++
            ];
            
            // Create the page
            $pageId = createPage($pageData);
            
            if ($pageId) {
                logMessage("✓ Successfully created page: $title");
            } else {
                logMessage("✗ Failed to create page: $title");
            }
            
            // Small delay to avoid overwhelming the server
            usleep(500000); // 0.5 seconds
            
        } catch (Exception $e) {
            logMessage("Error processing {$menuItem['title']}: " . $e->getMessage());
            continue;
        }
    }
    
    logMessage("Migration completed!");
    logMessage("Total items processed: " . count($menuItems));
    
} catch (Exception $e) {
    logMessage("Fatal error: " . $e->getMessage());
    exit(1);
}

fclose($log);
echo "\nMigration log saved to: $LOG_FILE\n";

