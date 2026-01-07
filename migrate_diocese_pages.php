<?php
/**
 * Migrate Diocese Pages from WordPress to Dynamic Pages
 * Scrapes content from old WordPress site and creates dynamic pages
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/security.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Define all diocese pages
$dioceses = [
    [
        'name' => 'Bongaigaon Diocese',
        'slug' => 'bongaigaon-diocese',
        'url' => 'https://donboscoguwahati.org/index.php/bongaigaon-diocese/',
        'menu_label' => 'Bongaigaon Diocese',
        'parent_menu' => 'houses',
        'is_submenu' => true,
        'sort_order' => 1,
    ],
    [
        'name' => 'Diphu Diocese',
        'slug' => 'diphu-diocese',
        'url' => 'https://donboscoguwahati.org/index.php/diphu-diocese/',
        'menu_label' => 'Diphu Diocese',
        'parent_menu' => 'houses',
        'is_submenu' => true,
        'sort_order' => 2,
    ],
    [
        'name' => 'Guwahati Archdiocese',
        'slug' => 'guwahati-archdiocese',
        'url' => 'https://donboscoguwahati.org/index.php/guwahati-archdiocese/',
        'menu_label' => 'Guwahati Archdiocese',
        'parent_menu' => 'houses',
        'is_submenu' => true,
        'sort_order' => 3,
    ],
    [
        'name' => 'Nongstoin Diocese',
        'slug' => 'nongstoin-diocese',
        'url' => 'https://donboscoguwahati.org/index.php/nongstoin-diocese/',
        'menu_label' => 'Nongstoin Diocese',
        'parent_menu' => 'houses',
        'is_submenu' => true,
        'sort_order' => 4,
    ],
    [
        'name' => 'Tezpur Diocese',
        'slug' => 'tezpur-diocese',
        'url' => 'https://donboscoguwahati.org/index.php/tezpur-diocese/',
        'menu_label' => 'Tezpur Diocese',
        'parent_menu' => 'houses',
        'is_submenu' => true,
        'sort_order' => 5,
    ],
    [
        'name' => 'Tura Diocese',
        'slug' => 'tura-diocese',
        'url' => 'https://donboscoguwahati.org/index.php/tura-diocese/',
        'menu_label' => 'Tura Diocese',
        'parent_menu' => 'houses',
        'is_submenu' => true,
        'sort_order' => 6,
    ],
];

/**
 * Download image from URL and save locally
 */
function downloadImage($imageUrl, $dioceseSlug) {
    if (empty($imageUrl)) return null;
    
    // Skip if already local
    if (strpos($imageUrl, '/uploads/') === 0 || strpos($imageUrl, 'uploads/') === 0) {
        return $imageUrl;
    }
    
    // Remove size parameters from WordPress URLs (e.g., -300x184.jpg)
    $imageUrl = preg_replace('/-(\d+)x(\d+)\.(jpg|jpeg|png|gif)$/i', '.$3', $imageUrl);
    
    $uploadDir = __DIR__ . '/public_html/uploads/images/dioceses/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $parsedUrl = parse_url($imageUrl);
    $pathInfo = pathinfo($parsedUrl['path'] ?? '');
    $extension = $pathInfo['extension'] ?? 'jpg';
    
    // Clean extension
    $extension = strtolower($extension);
    if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
        $extension = 'jpg';
    }
    
    $filename = $dioceseSlug . '-' . uniqid() . '.' . $extension;
    $filePath = $uploadDir . $filename;
    
    // Use file_get_contents with context for better compatibility
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept: image/*',
            ],
            'timeout' => 30,
            'follow_location' => true,
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ]
    ]);
    
    $imageData = @file_get_contents($imageUrl, false, $context);
    
    if ($imageData !== false && strlen($imageData) > 0) {
        $saved = file_put_contents($filePath, $imageData);
        if ($saved !== false && file_exists($filePath) && filesize($filePath) > 0) {
            $localPath = '/uploads/images/dioceses/' . $filename;
            return $localPath;
        } else {
            echo "    ⚠️  Failed to write file\n";
        }
    } else {
        // Fallback to cURL
        $ch = curl_init($imageUrl);
        $fp = fopen($filePath, 'wb');
        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        fclose($fp);
        
        if ($httpCode === 200 && $result !== false && file_exists($filePath)) {
            $fileSize = filesize($filePath);
            if ($fileSize > 0) {
                $localPath = '/uploads/images/dioceses/' . $filename;
                return $localPath;
            } else {
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
                echo "    ⚠️  Downloaded file is empty\n";
            }
        } else {
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            if ($error) {
                echo "    ⚠️  cURL Error: {$error}\n";
            } else {
                echo "    ⚠️  HTTP Code: {$httpCode}\n";
            }
        }
    }
    
    return null;
}

/**
 * Clean HTML content - remove old site links and unwanted elements
 */
function cleanContent($html, $baseUrl) {
    if (empty($html)) return '';
    
    $dom = new DOMDocument();
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    $xpath = new DOMXPath($dom);
    
    // Remove links to old site
    $links = $xpath->query('//a[contains(@href, "donboscoguwahati.org")]');
    foreach ($links as $link) {
        $text = $link->textContent;
        $textNode = $dom->createTextNode($text);
        $link->parentNode->replaceChild($textNode, $link);
    }
    
    // Remove category and author links
    $categoryLinks = $xpath->query('//a[contains(@href, "/category/") or contains(@href, "/author/")]');
    foreach ($categoryLinks as $link) {
        $text = $link->textContent;
        $textNode = $dom->createTextNode($text);
        $link->parentNode->replaceChild($textNode, $link);
    }
    
    // Update image URLs
    $images = $xpath->query('//img');
    foreach ($images as $img) {
        $src = $img->getAttribute('src');
        if (!empty($src) && strpos($src, 'http') === 0) {
            // Keep original for now, will be processed separately
        }
    }
    
    $cleaned = $dom->saveHTML();
    // Remove XML declaration
    $cleaned = preg_replace('/<\?xml[^>]*\?>/', '', $cleaned);
    return $cleaned;
}

/**
 * Extract content from WordPress page
 */
function extractDioceseContent($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || empty($html)) {
        return null;
    }
    
    $dom = new DOMDocument();
    @$dom->loadHTML($html);
    $xpath = new DOMXPath($dom);
    
    $data = [
        'title' => '',
        'content' => '',
        'excerpt' => '',
        'featured_image' => '',
    ];
    
    // Extract title - try multiple selectors
    $titleSelectors = [
        '//h1[@class="entry-title"]',
        '//h1[contains(@class, "post-title")]',
        '//article//h1',
        '//h1',
        '//div[@class="page-title"]//h1',
        '//title',
    ];
    
    foreach ($titleSelectors as $selector) {
        $titleNodes = $xpath->query($selector);
        if ($titleNodes->length > 0) {
            $titleText = trim($titleNodes->item(0)->textContent);
            // Clean title (remove site name, etc.)
            $titleText = preg_replace('/\s*[-|]\s*.*$/', '', $titleText);
            if (strlen($titleText) > 3 && strlen($titleText) < 200) {
                $data['title'] = $titleText;
                break;
            }
        }
    }
    
    // Extract featured image
    $imgNodes = $xpath->query('//div[contains(@class, "post-thumbnail")]//img | //article//img[1]');
    if ($imgNodes->length > 0) {
        $img = $imgNodes->item(0);
        $data['featured_image'] = $img->getAttribute('src') ?: $img->getAttribute('data-src');
        if (!empty($data['featured_image']) && strpos($data['featured_image'], 'http') !== 0) {
            $data['featured_image'] = 'https://donboscoguwahati.org' . $data['featured_image'];
        }
    }
    
    // Extract content - try multiple selectors
    $contentSelectors = [
        '//div[contains(@class, "entry-content")]',
        '//div[contains(@class, "post-content")]',
        '//article//div[contains(@class, "content")]',
        '//div[@id="content"]//div[contains(@class, "post")]',
        '//div[contains(@class, "page-content")]',
        '//main//div[contains(@class, "content")]',
        '//div[@class="content"]',
    ];
    
    $contentNode = null;
    foreach ($contentSelectors as $selector) {
        $contentNodes = $xpath->query($selector);
        if ($contentNodes->length > 0) {
            $contentNode = $contentNodes->item(0);
            $testContent = trim($contentNode->textContent);
            if (strlen($testContent) > 100) { // Make sure we got substantial content
                break;
            }
        }
    }
    
    if ($contentNode) {
        // Remove unwanted elements
        $unwanted = $xpath->query('.//div[contains(@class, "post-meta")] | .//div[contains(@class, "post-categories")] | .//div[contains(@class, "tags")] | .//div[contains(@class, "author")] | .//div[contains(@class, "share")] | .//div[contains(@class, "comments")]', $contentNode);
        foreach ($unwanted as $node) {
            if ($node->parentNode) {
                $node->parentNode->removeChild($node);
            }
        }
        
        $data['content'] = $dom->saveHTML($contentNode);
        
        // Extract excerpt (first substantial paragraph)
        $paragraphs = $xpath->query('.//p', $contentNode);
        if ($paragraphs->length > 0) {
            foreach ($paragraphs as $para) {
                $text = trim($para->textContent);
                if (strlen($text) > 50) { // Skip very short paragraphs
                    $data['excerpt'] = $text;
                    if (strlen($data['excerpt']) > 300) {
                        $data['excerpt'] = substr($data['excerpt'], 0, 297) . '...';
                    }
                    break;
                }
            }
        }
    } else {
        // Fallback: try to get all text content from article or main content area
        $fallbackSelectors = [
            '//article',
            '//main',
            '//div[@id="main-content"]',
            '//div[@id="content"]',
            '//div[contains(@class, "main")]',
            '//div[contains(@class, "page")]',
        ];
        
        foreach ($fallbackSelectors as $selector) {
            $articleNodes = $xpath->query($selector);
            if ($articleNodes->length > 0) {
                $articleNode = $articleNodes->item(0);
                
                // Remove navigation, sidebars, footers
                $unwanted = $xpath->query('.//nav | .//aside | .//footer | .//header | .//script | .//style', $articleNode);
                foreach ($unwanted as $node) {
                    if ($node->parentNode) {
                        $node->parentNode->removeChild($node);
                    }
                }
                
                $html = $dom->saveHTML($articleNode);
                $text = trim($articleNode->textContent);
                
                if (strlen($text) > 200) { // Make sure we have substantial content
                    $data['content'] = $html;
                    $data['excerpt'] = substr($text, 0, 300);
                    break;
                }
            }
        }
    }
    
    // Final check: if still no content, try to extract from body
    if (empty($data['content'])) {
        $bodyNodes = $xpath->query('//body');
        if ($bodyNodes->length > 0) {
            $bodyNode = $bodyNodes->item(0);
            
            // Remove all unwanted elements
            $unwanted = $xpath->query('.//nav | .//aside | .//footer | .//header | .//script | .//style | .//div[contains(@class, "sidebar")] | .//div[contains(@class, "menu")] | .//div[contains(@class, "widget")]', $bodyNode);
            foreach ($unwanted as $node) {
                if ($node->parentNode) {
                    $node->parentNode->removeChild($node);
                }
            }
            
            $html = $dom->saveHTML($bodyNode);
            $text = trim($bodyNode->textContent);
            
            if (strlen($text) > 200) {
                $data['content'] = $html;
                $data['excerpt'] = substr($text, 0, 300);
            }
        }
    }
    
    return $data;
}

try {
    $db = Database::getInstance()->getConnection();
    
    echo "=== Migrating Diocese Pages ===\n\n";
    
    $created = 0;
    $updated = 0;
    $skipped = 0;
    $errors = 0;
    
    foreach ($dioceses as $diocese) {
        echo "Processing: {$diocese['name']}...\n";
        echo "  URL: {$diocese['url']}\n";
        
        // Extract content
        $contentData = extractDioceseContent($diocese['url']);
        
        if (!$contentData) {
            echo "  ❌ Failed to extract content\n\n";
            $errors++;
            continue;
        }
        
        // Use extracted title or fallback to name
        $title = !empty($contentData['title']) ? $contentData['title'] : $diocese['name'];
        
        // Download featured image
        $featuredImage = null;
        if (!empty($contentData['featured_image'])) {
            echo "  Downloading featured image from: {$contentData['featured_image']}\n";
            $featuredImage = downloadImage($contentData['featured_image'], $diocese['slug']);
            if ($featuredImage) {
                echo "  ✅ Image saved locally: {$featuredImage}\n";
            } else {
                echo "  ⚠️  Failed to download image, keeping original URL\n";
                // Keep original URL as fallback
                $featuredImage = $contentData['featured_image'];
            }
        }
        
        // Clean content
        $content = cleanContent($contentData['content'], $diocese['url']);
        
        // Log content length for debugging
        if (!empty($content)) {
            echo "  Content length: " . strlen($content) . " characters\n";
        } else {
            echo "  ⚠️  Warning: No content extracted for {$diocese['name']}\n";
        }
        
        // Check if page exists
        $checkStmt = $db->prepare("SELECT id FROM pages WHERE slug = :slug AND deleted_at IS NULL");
        $checkStmt->execute(['slug' => $diocese['slug']]);
        $existing = $checkStmt->fetch();
        
        if ($existing) {
            // Update existing page
            $stmt = $db->prepare("
                UPDATE pages SET
                    title = :title,
                    content = :content,
                    excerpt = :excerpt,
                    featured_image = COALESCE(:featured_image, featured_image),
                    menu_label = :menu_label,
                    parent_menu = :parent_menu,
                    is_submenu = :is_submenu,
                    sort_order = :sort_order,
                    updated_at = NOW()
                WHERE id = :id
            ");
            
            $stmt->execute([
                'id' => $existing['id'],
                'title' => $title,
                'content' => $content,
                'excerpt' => $contentData['excerpt'] ?? '',
                'featured_image' => $featuredImage,
                'menu_label' => $diocese['menu_label'],
                'parent_menu' => $diocese['parent_menu'],
                'is_submenu' => $diocese['is_submenu'] ? 1 : 0,
                'sort_order' => $diocese['sort_order'],
            ]);
            
            echo "  ✅ Updated: {$title} (ID: {$existing['id']})\n\n";
            $updated++;
        } else {
            // Create new page
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
                'title' => $title,
                'slug' => $diocese['slug'],
                'content' => $content,
                'excerpt' => $contentData['excerpt'] ?? '',
                'meta_title' => $title,
                'meta_description' => $contentData['excerpt'] ?? '',
                'featured_image' => $featuredImage,
                'menu_label' => $diocese['menu_label'],
                'menu_position' => 0,
                'parent_menu' => $diocese['parent_menu'],
                'is_submenu' => $diocese['is_submenu'] ? 1 : 0,
                'is_enabled' => 1,
                'is_featured' => 0,
                'show_in_menu' => 1,
                'sort_order' => $diocese['sort_order'],
            ]);
            
            $id = $db->lastInsertId();
            echo "  ✅ Created: {$title} (ID: {$id})\n\n";
            $created++;
        }
        
        // Small delay to avoid overwhelming the server
        sleep(1);
    }
    
    echo "=== Migration Complete ===\n";
    echo "✅ Created: {$created} pages\n";
    echo "🔄 Updated: {$updated} pages\n";
    echo "⏭️  Skipped: {$skipped} pages\n";
    echo "❌ Errors: {$errors} pages\n";
    echo "\nAll diocese pages are now available in the Dynamic Pages section.\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

