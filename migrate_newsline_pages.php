<?php
/**
 * Migrate NewsLine Content and Submenu Data from WordPress
 * Scrapes NewsLine section from old WordPress site and creates dynamic pages
 */

// Increase memory limit
ini_set('memory_limit', '1024M');

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/security.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Configuration
$WORDPRESS_BASE_URL = 'https://donboscoguwahati.org';
$NEWSLINE_URL = $WORDPRESS_BASE_URL . '/index.php/news-line/';
$UPLOAD_DIR = __DIR__ . '/public_html/uploads/newsline/';
$LOG_FILE = __DIR__ . '/newsline_migration_log.txt';

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
 * Extract NewsLine menu items and submenu items from WordPress navigation
 */
function extractNewsLineMenuItems($html) {
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
    
    // First, find ALL PDF links on the page (NewsLine PDFs)
    $allPdfLinks = $xpath->query("//a[contains(@href, '.pdf')]");
    
    foreach ($allPdfLinks as $link) {
        $href = $link->getAttribute('href');
        $text = trim($link->textContent);
        
        // Make absolute URL if relative
        if (!empty($href) && strpos($href, 'http') !== 0) {
            $href = 'https://donboscoguwahati.org' . $href;
        }
        
        // Skip external links
        if (strpos($href, 'issuu.com') !== false || strpos($href, 'donboscoguwahati.org') === false) {
            continue;
        }
        
        // Extract title from link text or nearby elements
        if (empty($text) || strlen($text) < 3) {
            // Try parent element
            $parent = $link->parentNode;
            if ($parent) {
                $text = trim($parent->textContent);
            }
            
            // Try previous sibling
            if (empty($text) && $link->previousSibling) {
                $text = trim($link->previousSibling->textContent);
            }
            
            // Try extracting from filename
            if (empty($text)) {
                $filename = basename(parse_url($href, PHP_URL_PATH));
                // Try to extract date from filename (e.g., "newsline-Dec-19.pdf" -> "December 2019")
                if (preg_match('/(\w+)[-_](\d{2,4})/i', $filename, $matches)) {
                    $month = ucfirst(strtolower($matches[1]));
                    $year = $matches[2];
                    if (strlen($year) == 2) {
                        $year = '20' . $year;
                    }
                    $text = $month . ' ' . $year;
                } else {
                    $text = str_replace(['.pdf', '-', '_'], ['', ' ', ' '], $filename);
                    $text = ucwords(strtolower($text));
                }
            }
        }
        
        // Clean up text
        $text = trim($text);
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Check if this looks like a NewsLine item (contains month/year pattern or "newsline" in URL)
        $isNewsLine = false;
        if (preg_match('/(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i', $text)) {
            $isNewsLine = true;
        }
        if (stripos($href, 'newsline') !== false || stripos($href, 'news-line') !== false) {
            $isNewsLine = true;
        }
        
        if ($isNewsLine && !empty($text) && !empty($href)) {
            // Normalize title to "MONTH YEAR" format
            if (preg_match('/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i', $text, $matches)) {
                $month = ucfirst(strtolower($matches[1]));
                $year = $matches[2];
                $text = strtoupper($month) . ' ' . $year;
            }
            
            // Check for duplicates
            $key = strtolower($text);
            if (!isset($seenTitles[$key]) && !isset($seenUrls[$href])) {
                $seenTitles[$key] = true;
                $seenUrls[$href] = true;
                
                $menuItems[] = [
                    'title' => $text,
                    'url' => $href,
                    'slug' => generateSlug($text),
                    'is_pdf' => true
                ];
            }
        }
    }
    
    // Also look for text links that might be NewsLine items (date patterns)
    $textLinks = $xpath->query("//a[contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'DECEMBER') or contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'SEPTEMBER') or contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'MARCH') or contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'JUNE')]");
    
    foreach ($textLinks as $link) {
        $href = $link->getAttribute('href');
        $text = trim($link->textContent);
        
        // Check if it matches date pattern
        if (preg_match('/(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i', $text)) {
            // Make absolute URL if relative
            if (!empty($href) && strpos($href, 'http') !== 0) {
                $href = 'https://donboscoguwahati.org' . $href;
            }
            
            // Normalize title
            if (preg_match('/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i', $text, $matches)) {
                $month = ucfirst(strtolower($matches[1]));
                $year = $matches[2];
                $text = strtoupper($month) . ' ' . $year;
            }
            
            // Check for duplicates
            $key = strtolower($text);
            if (!isset($seenTitles[$key]) && !empty($href)) {
                // If URL is a PDF, mark it
                $isPdf = strpos($href, '.pdf') !== false;
                
                if (!isset($seenUrls[$href])) {
                    $seenTitles[$key] = true;
                    $seenUrls[$href] = true;
                    
                    $menuItems[] = [
                        'title' => $text,
                        'url' => $href,
                        'slug' => generateSlug($text),
                        'is_pdf' => $isPdf
                    ];
                }
            }
        }
    }
    
    // Sort by date (newest first)
    usort($menuItems, function($a, $b) {
        // Extract year and month from title
        preg_match('/(\d{4})/', $a['title'], $matchA);
        preg_match('/(\d{4})/', $b['title'], $matchB);
        $yearA = isset($matchA[1]) ? intval($matchA[1]) : 0;
        $yearB = isset($matchB[1]) ? intval($matchB[1]) : 0;
        
        if ($yearA !== $yearB) {
            return $yearB - $yearA; // Descending by year
        }
        
        // If same year, sort by month
        $months = ['january' => 1, 'february' => 2, 'march' => 3, 'april' => 4, 'may' => 5, 'june' => 6,
                   'july' => 7, 'august' => 8, 'september' => 9, 'october' => 10, 'november' => 11, 'december' => 12];
        preg_match('/(\w+)/i', $a['title'], $monthA);
        preg_match('/(\w+)/i', $b['title'], $monthB);
        $monthNumA = isset($monthA[1]) && isset($months[strtolower($monthA[1])]) ? $months[strtolower($monthA[1])] : 0;
        $monthNumB = isset($monthB[1]) && isset($months[strtolower($monthB[1])]) ? $months[strtolower($monthB[1])] : 0;
        
        return $monthNumB - $monthNumA; // Descending by month
    });
    
    return $menuItems;
}

/**
 * Extract NewsLine content from a page
 */
function extractNewsLineContent($html, $url) {
    // Limit HTML size to prevent memory issues
    if (strlen($html) > 5000000) { // 5MB limit
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
        'featured_image' => '',
        'pdf_url' => '',
        'images' => []
    ];
    
    // Extract title
    $titleNodes = $xpath->query("//h1 | //h2[contains(@class, 'entry-title')] | //h1[contains(@class, 'page-title')]");
    if ($titleNodes->length > 0) {
        $content['title'] = trim($titleNodes->item(0)->textContent);
    }
    
    // Extract main content
    $contentNodes = $xpath->query("//div[contains(@class, 'entry-content')] | //div[contains(@class, 'content')] | //article");
    if ($contentNodes->length > 0) {
        $contentNode = $contentNodes->item(0);
        $content['content'] = $dom->saveHTML($contentNode);
    }
    
    // Extract excerpt (first paragraph)
    $excerptNodes = $xpath->query("//div[contains(@class, 'entry-content')]//p[1] | //div[contains(@class, 'content')]//p[1]");
    if ($excerptNodes->length > 0) {
        $content['excerpt'] = trim($excerptNodes->item(0)->textContent);
    }
    
    // Extract featured image
    $imgNodes = $xpath->query("//img[contains(@class, 'wp-post-image')] | //img[contains(@class, 'featured')] | //div[contains(@class, 'featured-image')]//img");
    if ($imgNodes->length > 0) {
        $img = $imgNodes->item(0);
        $imgSrc = $img->getAttribute('src') ?: $img->getAttribute('data-src');
        if ($imgSrc) {
            if (strpos($imgSrc, 'http') !== 0) {
                $imgSrc = 'https://donboscoguwahati.org' . $imgSrc;
            }
            $content['featured_image'] = $imgSrc;
        }
    }
    
    // Extract PDF links
    $pdfLinks = $xpath->query("//a[contains(@href, '.pdf')]");
    if ($pdfLinks->length > 0) {
        $pdfUrl = $pdfLinks->item(0)->getAttribute('href');
        if (strpos($pdfUrl, 'http') !== 0) {
            $pdfUrl = 'https://donboscoguwahati.org' . $pdfUrl;
        }
        $content['pdf_url'] = $pdfUrl;
    }
    
    // Extract all images
    $allImages = $xpath->query("//img");
    foreach ($allImages as $img) {
        $imgSrc = $img->getAttribute('src') ?: $img->getAttribute('data-src');
        if ($imgSrc && strpos($imgSrc, 'http') !== 0) {
            $imgSrc = 'https://donboscoguwahati.org' . $imgSrc;
        }
        if ($imgSrc && !in_array($imgSrc, $content['images'])) {
            $content['images'][] = $imgSrc;
        }
    }
    
    return $content;
}

/**
 * Generate slug from title
 */
function generateSlug($title) {
    $slug = strtolower(trim($title));
    $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
    $slug = preg_replace('/-+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

/**
 * Download image and return local path
 */
function downloadImage($url, $slug) {
    global $UPLOAD_DIR;
    
    if (empty($url)) {
        return null;
    }
    
    try {
        $extension = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION);
        if (empty($extension)) {
            $extension = 'jpg';
        }
        
        $filename = $slug . '-' . time() . '.' . $extension;
        $localPath = $UPLOAD_DIR . $filename;
        
        downloadFile($url, $localPath);
        
        return '/uploads/newsline/' . $filename;
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
        
        downloadFile($url, $localPath);
        
        return '/uploads/newsline/' . $filename;
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
    $html = preg_replace('/<a[^>]*href=["\']https?:\/\/donboscoguwahati\.org[^"\']*["\'][^>]*>(.*?)<\/a>/i', '$1', $html);
    
    // Remove script and style tags
    $html = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
    $html = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $html);
    
    // Update image URLs to local paths (will be done after download)
    
    return $html;
}

/**
 * Create dynamic page in database
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
                featured_image, menu_label, menu_position, parent_menu, is_submenu,
                is_enabled, is_featured, show_in_menu, sort_order
            ) VALUES (
                :title, :slug, :content, :excerpt, :meta_title, :meta_description,
                :featured_image, :menu_label, :menu_position, :parent_menu, :is_submenu,
                :is_enabled, :is_featured, :show_in_menu, :sort_order
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
    logMessage("Starting NewsLine migration...");
    
    $db = Database::getInstance()->getConnection();
    
    // Fetch main NewsLine page
    logMessage("Fetching main NewsLine page: $NEWSLINE_URL");
    $html = fetchUrl($NEWSLINE_URL);
    
    // Extract menu items
    logMessage("Extracting NewsLine menu items...");
    $menuItems = extractNewsLineMenuItems($html);
    logMessage("Found " . count($menuItems) . " NewsLine menu items");
    
    $sortOrder = 1;
    
    // Process each menu item
    foreach ($menuItems as $menuItem) {
        logMessage("Processing: {$menuItem['title']} - {$menuItem['url']}");
        
        try {
            // Check if this is a direct PDF link
            $isPdf = isset($menuItem['is_pdf']) && $menuItem['is_pdf'];
            $isPdfUrl = strpos($menuItem['url'], '.pdf') !== false;
            
            if ($isPdf || $isPdfUrl) {
                // Handle PDF directly - create a page that links to the PDF
                $title = $menuItem['title'];
                $slug = $menuItem['slug'];
                
                // Download PDF
                $pdfPath = downloadPDF($menuItem['url'], $slug);
                
                if ($pdfPath) {
                    // Create simple content with PDF link
                    $pageContent = '<div class="newsline-pdf-page">';
                    $pageContent .= '<h2>' . htmlspecialchars($title) . '</h2>';
                    $pageContent .= '<p>Click the link below to view or download the NewsLine PDF:</p>';
                    $pageContent .= '<p><a href="' . htmlspecialchars($pdfPath) . '" target="_blank" class="pdf-download-btn" style="display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Download/View PDF</a></p>';
                    $pageContent .= '</div>';
                    
                    $pageData = [
                        'title' => $title,
                        'slug' => $slug,
                        'content' => $pageContent,
                        'excerpt' => "NewsLine PDF: $title",
                        'featured_image' => null,
                        'menu_label' => $title,
                        'parent_menu' => 'newsline',
                        'is_submenu' => true,
                        'show_in_menu' => true,
                        'sort_order' => $sortOrder++
                    ];
                    
                    $pageId = createPage($pageData);
                    
                    if ($pageId) {
                        logMessage("✓ Successfully created PDF page: $title");
                    } else {
                        logMessage("✗ Failed to create PDF page: $title");
                    }
                } else {
                    logMessage("✗ Failed to download PDF: {$menuItem['url']}");
                }
                
                continue;
            }
            
            // Fetch the page content
            $pageHtml = fetchUrl($menuItem['url']);
            $content = extractNewsLineContent($pageHtml, $menuItem['url']);
            
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
                    $content['content'] .= '<p><a href="' . $pdfPath . '" target="_blank" class="pdf-download">Download PDF</a></p>';
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
                'parent_menu' => 'newsline',
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

