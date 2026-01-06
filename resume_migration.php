<?php
/**
 * Resume News Migration Script
 * 
 * This script safely resumes the news migration by:
 * 1. Checking which news items already exist in the database
 * 2. Skipping already-migrated items
 * 3. Continuing from where it left off
 * 
 * Usage: php resume_migration.php
 */

// Configuration
define('API_BASE_URL', 'http://localhost:8000/api');
define('WORDPRESS_URL', 'https://donboscoguwahati.org/index.php/category/main-news/');
define('MAX_PAGES', 58);
define('LOG_FILE', 'resume_migration_log.txt');

// Credentials (update these)
$username = 'admin'; // Update with your admin username
$password = 'admin'; // Update with your admin password

// Logging function
function logMessage($message, $level = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message\n";
    file_put_contents(LOG_FILE, $logEntry, FILE_APPEND);
    echo $logEntry;
}

// Get CSRF token and session cookie
function getAuthToken($apiBaseUrl, $username, $password, $existingCookieFile = null) {
    // If re-authenticating, delete old cookie file
    if ($existingCookieFile && file_exists($existingCookieFile)) {
        @unlink($existingCookieFile);
    }
    
    $cookieFile = sys_get_temp_dir() . '/migration_cookies_' . getmypid() . '_' . time() . '.txt';
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiBaseUrl . '/auth/login',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'username' => $username,
            'password' => $password
        ]),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ],
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($response === false || !empty($curlError)) {
        throw new Exception("Connection failed: $curlError. Make sure PHP server is running at $apiBaseUrl");
    }
    
    if ($httpCode !== 200) {
        throw new Exception("Failed to authenticate: HTTP $httpCode - Response: $response");
    }
    
    $data = json_decode($response, true);
    if (!$data || !isset($data['csrf_token'])) {
        throw new Exception("Failed to get CSRF token. Response: " . $response);
    }
    
    return [
        'token' => $data['csrf_token'],
        'cookie_file' => $cookieFile
    ];
}

// Check if news item already exists
function newsItemExists($apiBaseUrl, $cookieFile, $title) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiBaseUrl . '/news/list?limit=1000&search=' . urlencode($title),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_TIMEOUT => 10,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if (isset($data['news']) && is_array($data['news'])) {
            foreach ($data['news'] as $item) {
                // Exact title match
                if (strcasecmp(trim($item['title']), trim($title)) === 0) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Extract news items from WordPress page
function extractNewsItems($url) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ]);
    
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$html) {
        return [];
    }
    
    $dom = new DOMDocument();
    @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
    $xpath = new DOMXPath($dom);
    
    $items = [];
    $articles = $xpath->query('//article[contains(@class, "post")]');
    
    foreach ($articles as $article) {
        $item = [];
        
        // Extract title
        $titleNodes = $xpath->query('.//div[@class="read-title"]/h3/a', $article);
        if ($titleNodes->length > 0) {
            $item['title'] = trim($titleNodes->item(0)->textContent);
        }
        
        // Extract link
        $linkNodes = $xpath->query('.//div[@class="read-title"]/h3/a/@href', $article);
        if ($linkNodes->length > 0) {
            $item['link'] = $linkNodes->item(0)->textContent;
        }
        
        // Extract excerpt
        $excerptNodes = $xpath->query('.//div[contains(@class, "read-descprition")]//div[contains(@class, "post-description")]', $article);
        if ($excerptNodes->length > 0) {
            $item['excerpt'] = trim($excerptNodes->item(0)->textContent);
        }
        
        // Extract featured image
        $imgNodes = $xpath->query('.//div[contains(@class, "read-img")]//img', $article);
        if ($imgNodes->length > 0) {
            $img = $imgNodes->item(0);
            $item['featured_image'] = $img->getAttribute('src') ?: $img->getAttribute('data-src');
        }
        
        // Extract date
        $dateNodes = $xpath->query('.//span[contains(@class, "posts-date")]', $article);
        if ($dateNodes->length > 0) {
            $item['date'] = trim($dateNodes->item(0)->textContent);
        }
        
        if (!empty($item['title'])) {
            $items[] = $item;
        }
    }
    
    return $items;
}

// Download image
function downloadImage($url, $prefix = '') {
    if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
        return null;
    }
    
    // Convert relative URLs to absolute
    if (strpos($url, 'http') !== 0) {
        $url = 'https://donboscoguwahati.org' . $url;
    }
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ]);
    
    $imageData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$imageData) {
        return null;
    }
    
    $ext = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION);
    $ext = $ext ?: 'jpg';
    $filename = $prefix . '_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $filepath = __DIR__ . '/public_html/uploads/images/' . $filename;
    
    $dir = dirname($filepath);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    if (file_put_contents($filepath, $imageData)) {
        return '/uploads/images/' . $filename;
    }
    
    return null;
}

// Get full content from news article
function getFullContent($url) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ]);
    
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$html) {
        return null;
    }
    
    $dom = new DOMDocument();
    @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
    $xpath = new DOMXPath($dom);
    
    $contentSelectors = [
        '//div[contains(@class, "entry-content")]',
        '//div[contains(@class, "post-content")]',
        '//article[contains(@class, "post")]//div[contains(@class, "content")]',
        '//div[@id="content"]',
    ];
    
    $content = '';
    foreach ($contentSelectors as $selector) {
        $nodes = $xpath->query($selector);
        if ($nodes->length > 0) {
            $content = $dom->saveHTML($nodes->item(0));
            break;
        }
    }
    
    // Download and replace images in content
    if ($content) {
        $imgNodes = $xpath->query('//img/@src | //img/@data-src');
        foreach ($imgNodes as $imgSrc) {
            $originalUrl = $imgSrc->textContent;
            $localPath = downloadImage($originalUrl, 'content_' . time());
            if ($localPath) {
                $content = str_replace($originalUrl, $localPath, $content);
            }
        }
    }
    
    return $content;
}

// Create news item via API
function createNewsItem($apiBaseUrl, &$csrfToken, &$cookieFile, $newsData, $username, $password) {
    $newsData['csrf_token'] = $csrfToken;
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiBaseUrl . '/news/create',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($newsData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-CSRF-Token: ' . $csrfToken
        ],
        CURLOPT_COOKIEFILE => $cookieFile,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // If session expired (401), re-authenticate and retry once
    if ($httpCode === 401) {
        logMessage("Session expired, re-authenticating...", 'WARNING');
        try {
            if (file_exists($cookieFile)) {
                @unlink($cookieFile);
            }
            
            $authResult = getAuthToken($apiBaseUrl, $username, $password, $cookieFile);
            $csrfToken = $authResult['token'];
            $newCookieFile = $authResult['cookie_file'];
            $cookieFile = $newCookieFile;
            
            logMessage("Re-authentication successful, retrying...", 'INFO');
            
            if (!file_exists($cookieFile) || filesize($cookieFile) === 0) {
                logMessage("Cookie file is empty after re-authentication", 'ERROR');
                return false;
            }
            
            usleep(500000);
            
            // Verify session
            $checkCh = curl_init();
            curl_setopt_array($checkCh, [
                CURLOPT_URL => $apiBaseUrl . '/auth/check',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_COOKIEFILE => $cookieFile,
                CURLOPT_COOKIEJAR => $cookieFile,
                CURLOPT_TIMEOUT => 5,
            ]);
            $checkResponse = curl_exec($checkCh);
            $checkCode = curl_getinfo($checkCh, CURLINFO_HTTP_CODE);
            curl_close($checkCh);
            
            if ($checkCode === 200) {
                $checkData = json_decode($checkResponse, true);
                if (isset($checkData['csrf_token'])) {
                    $csrfToken = $checkData['csrf_token'];
                }
            }
            
            // Retry
            $newsData['csrf_token'] = $csrfToken;
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $apiBaseUrl . '/news/create',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($newsData),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'X-CSRF-Token: ' . $csrfToken
                ],
                CURLOPT_COOKIEFILE => $cookieFile,
                CURLOPT_COOKIEJAR => $cookieFile,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_CONNECTTIMEOUT => 5,
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
        } catch (Exception $e) {
            logMessage("Re-authentication failed: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }
    
    return $httpCode === 200 || $httpCode === 201;
}

// Main migration function
function migrateNews($apiBaseUrl, $wordpressUrl, $maxPages, $username, $password) {
    logMessage("=== Resuming news migration ===");
    logMessage("This script will skip items that already exist in the database");
    
    try {
        $authResult = getAuthToken($apiBaseUrl, $username, $password);
        $csrfToken = $authResult['token'];
        $cookieFile = $authResult['cookie_file'];
        logMessage("Authentication successful");
    } catch (Exception $e) {
        logMessage("Migration failed: " . $e->getMessage(), 'ERROR');
        return;
    }
    
    $totalMigrated = 0;
    $totalSkipped = 0;
    $totalFailed = 0;
    
    for ($page = 1; $page <= $maxPages; $page++) {
        $pageUrl = $wordpressUrl . ($page > 1 ? 'page/' . $page . '/' : '');
        logMessage("Processing page $page of $maxPages");
        
        $items = extractNewsItems($pageUrl);
        logMessage("Found " . count($items) . " items on page $page");
        
        if (empty($items)) {
            logMessage("No items found on page $page, stopping migration");
            break;
        }
        
        foreach ($items as $item) {
            if (empty($item['title'])) {
                continue;
            }
            
            logMessage("Processing: " . $item['title']);
            
            // Check if already exists
            if (newsItemExists($apiBaseUrl, $cookieFile, $item['title'])) {
                logMessage("Skipping (already exists): " . $item['title'], 'INFO');
                $totalSkipped++;
                continue;
            }
            
            // Download featured image
            $featuredImage = null;
            if (!empty($item['featured_image'])) {
                $featuredImage = downloadImage($item['featured_image'], 'featured_' . time());
                if (!$featuredImage) {
                    logMessage("Failed to download featured image: " . $item['featured_image'], 'WARNING');
                }
            }
            
            // Get full content
            $content = '';
            if (!empty($item['link'])) {
                $content = getFullContent($item['link']);
            }
            
            // Prepare news data
            $newsData = [
                'title' => $item['title'],
                'excerpt' => $item['excerpt'] ?? '',
                'content' => $content ?: ($item['excerpt'] ?? ''),
                'featured_image' => $featuredImage,
                'published_at' => !empty($item['date']) ? date('Y-m-d H:i:s', strtotime($item['date'])) : date('Y-m-d H:i:s'),
            ];
            
            // Create news item
            if (createNewsItem($apiBaseUrl, $csrfToken, $cookieFile, $newsData, $username, $password)) {
                logMessage("Successfully migrated: " . $item['title'], 'SUCCESS');
                $totalMigrated++;
            } else {
                logMessage("Failed to migrate: " . $item['title'], 'ERROR');
                $totalFailed++;
            }
            
            // Small delay to avoid overwhelming the server
            usleep(500000); // 0.5 seconds
        }
    }
    
    logMessage("=== Migration completed ===");
    logMessage("Total migrated: $totalMigrated");
    logMessage("Total skipped (already exist): $totalSkipped");
    logMessage("Total failed: $totalFailed");
}

// Run migration
migrateNews(API_BASE_URL, WORDPRESS_URL, MAX_PAGES, $username, $password);

