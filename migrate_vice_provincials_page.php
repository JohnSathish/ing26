<?php
/**
 * Migrate Vice Provincials page from WordPress to local site
 * Fetches content from WordPress and creates/updates dynamic page
 */

ini_set('memory_limit', '512M');

define('API_ACCESS', true);

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Configuration
$WORDPRESS_URL = 'https://donboscoguwahati.org/index.php/vice-provincials/';
$PAGE_SLUG = 'vice-provincial';
$UPLOAD_DIR = __DIR__ . '/public_html/uploads/pages/';
$LOG_FILE = __DIR__ . '/vice_provincials_migration_log.txt';

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

function downloadImage($url, $baseUrl, $prefix = 'vice_provincial') {
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
    
    // Extract content - look for main content area
    $content = '';
    $contentNodes = $xpath->query('//div[contains(@class, "entry-content")] | //div[contains(@class, "post-content")] | //article | //main | //div[contains(@class, "content")]');
    
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
        // Fallback: try to find table directly
        $tableNodes = $xpath->query('//table');
        if ($tableNodes->length > 0) {
            $table = $tableNodes->item(0);
            // Get the table and any headings before it
            $heading = $xpath->query('//h1 | //h2 | //h3');
            if ($heading->length > 0) {
                $content .= $dom->saveHTML($heading->item(0));
            }
            $content .= $dom->saveHTML($table);
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
    }
    
    // Extract featured image
    $featuredImage = '';
    $imgSelectors = [
        '//img[contains(@class, "wp-post-image")]',
        '//img[contains(@class, "featured")]',
        '//div[contains(@class, "featured-image")]//img',
        '//div[contains(@class, "post-thumbnail")]//img',
        '//article//img[1]',
        '//table//img[1]'
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
        'title' => $title ?: 'Vice Provincials',
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
        // Keep the link if it's an internal anchor, otherwise replace with text
        $href = $link->getAttribute('href');
        if (strpos($href, '#') === 0 || strpos($href, 'javascript:') === 0) {
            continue; // Keep internal anchors
        }
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
logMessage("Starting Vice Provincials page migration from: $WORDPRESS_URL");

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
        $localPath = downloadImage($imageUrl, $WORDPRESS_URL, 'vice_provincial');
        if ($localPath) {
            $imageMap[$imageUrl] = $localPath;
        }
    }
    
    // Update content with local image paths
    $updatedContent = $pageData['content'];
    $updatedFeaturedImage = $pageData['featured_image'];
    
    foreach ($imageMap as $oldUrl => $newPath) {
        // Replace in content - handle different URL formats
        $updatedContent = str_replace($oldUrl, $newPath, $updatedContent);
        // Also replace with size parameters removed
        $oldUrlNoSize = preg_replace('/-(\d+)x(\d+)\.(jpg|jpeg|png|gif|webp)$/i', '.$3', $oldUrl);
        if ($oldUrlNoSize !== $oldUrl) {
            $updatedContent = str_replace($oldUrlNoSize, $newPath, $updatedContent);
        }
        // Replace in featured image
        if ($updatedFeaturedImage === $oldUrl || $updatedFeaturedImage === $oldUrlNoSize) {
            $updatedFeaturedImage = $newPath;
        }
    }
    
    // Clean content
    $updatedContent = cleanContent($updatedContent, $WORDPRESS_URL);
    
    // Ensure table has proper structure and styling
    if (strpos($updatedContent, '<table') !== false || strpos($updatedContent, 'table') !== false) {
        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        
        // Wrap content in a div to ensure it's valid HTML
        $wrappedContent = '<div>' . $updatedContent . '</div>';
        @$dom->loadHTML('<?xml encoding="UTF-8">' . $wrappedContent, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_PARSEHUGE);
        libxml_clear_errors();
        
        $xpath = new DOMXPath($dom);
        $tables = $xpath->query('//table');
        
        if ($tables->length === 0) {
            // No table found - try to find table-like structure or create one from content
            logMessage("No table found, attempting to create table from content...");
            
            // Look for patterns that suggest table data
            // This is a fallback - ideally the WordPress site should have a proper table
            $updatedContent = '<div class="table-wrapper"><table class="vice-provincials-table"><thead><tr><th>S.No</th><th>Photo</th><th>Name</th><th>Year From</th><th>Year To</th></tr></thead><tbody>' . $updatedContent . '</tbody></table></div>';
        } else {
            foreach ($tables as $table) {
                // Add class to table
                $table->setAttribute('class', 'vice-provincials-table');
                
                // Ensure table has thead and tbody
                $thead = $xpath->query('.//thead', $table)->item(0);
                $tbody = $xpath->query('.//tbody', $table)->item(0);
                
                // Get all rows
                $allRows = $xpath->query('.//tr', $table);
                
                if (!$thead && $allRows->length > 0) {
                    // Find first row and move it to thead
                    $firstRow = $allRows->item(0);
                    if ($firstRow) {
                        $thead = $dom->createElement('thead');
                        $clonedRow = $firstRow->cloneNode(true);
                        
                        // Convert td to th in header row
                        $tds = $xpath->query('.//td', $clonedRow);
                        foreach ($tds as $td) {
                            $th = $dom->createElement('th');
                            foreach ($td->childNodes as $child) {
                                $th->appendChild($child->cloneNode(true));
                            }
                            $td->parentNode->replaceChild($th, $td);
                        }
                        
                        $thead->appendChild($clonedRow);
                        $table->insertBefore($thead, $table->firstChild);
                        $firstRow->parentNode->removeChild($firstRow);
                    }
                }
                
                if (!$tbody) {
                    // Wrap remaining rows in tbody
                    $rows = $xpath->query('.//tr', $table);
                    if ($rows->length > 0) {
                        $tbody = $dom->createElement('tbody');
                        foreach ($rows as $row) {
                            $parent = $row->parentNode;
                            if ($parent && $parent->nodeName !== 'thead') {
                                $clonedRow = $row->cloneNode(true);
                                $tbody->appendChild($clonedRow);
                                $row->parentNode->removeChild($row);
                            }
                        }
                        if ($tbody->hasChildNodes()) {
                            $table->appendChild($tbody);
                        }
                    }
                }
                
                // Ensure images in table cells are properly sized
                $images = $xpath->query('.//td//img | .//th//img', $table);
                foreach ($images as $img) {
                    $img->setAttribute('style', 'width: 100px; height: 120px; object-fit: cover; border-radius: 0.375rem; border: 3px solid #e5e7eb;');
                }
                
                // Ensure all cells have proper content
                $cells = $xpath->query('.//td | .//th', $table);
                foreach ($cells as $cell) {
                    $text = trim($cell->textContent);
                    if (empty($text) && $cell->getElementsByTagName('img')->length === 0) {
                        // Add non-breaking space to empty cells
                        $cell->appendChild($dom->createTextNode("\xC2\xA0")); // &nbsp;
                    }
                }
            }
            
            // Get updated HTML from wrapper div
            $wrapper = $dom->getElementsByTagName('div')->item(0);
            if ($wrapper) {
                $innerHTML = '';
                foreach ($wrapper->childNodes as $child) {
                    $innerHTML .= $dom->saveHTML($child);
                }
                $updatedContent = $innerHTML;
            }
            
            // Wrap table in a container for better styling
            if (strpos($updatedContent, 'class="table-wrapper"') === false) {
                $updatedContent = preg_replace(
                    '/(<table[^>]*class="vice-provincials-table"[^>]*>)/i',
                    '<div class="table-wrapper">$1',
                    $updatedContent
                );
                $updatedContent = preg_replace(
                    '/(<\/table>)/i',
                    '$1</div>',
                    $updatedContent
                );
            }
        }
    }
    
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

