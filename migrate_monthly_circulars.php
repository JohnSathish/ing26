<?php
/**
 * Migrate Monthly Circulars from WordPress
 * Fetches monthly circulars for each year and creates entries in the circulars table
 */

ini_set('memory_limit', '1024M');

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/security.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Configuration
$WORDPRESS_BASE_URL = 'https://donboscoguwahati.org';
$UPLOAD_DIR = __DIR__ . '/public_html/uploads/circulars/';
$LOG_FILE = __DIR__ . '/monthly_circulars_migration_log.txt';

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
 * Extract monthly circulars from a year page
 */
function extractMonthlyCirculars($html, $year) {
    if (strlen($html) > 5000000) {
        $html = substr($html, 0, 5000000);
    }
    
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'), LIBXML_PARSEHUGE);
    libxml_clear_errors();
    $xpath = new DOMXPath($dom);
    
    $monthlyCirculars = [];
    $monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                   'july', 'august', 'september', 'october', 'november', 'december'];
    
    // Find all PDF links on the page
    $pdfLinks = $xpath->query("//a[contains(@href, '.pdf')]");
    
    foreach ($pdfLinks as $link) {
        $href = $link->getAttribute('href');
        $text = trim($link->textContent);
        
        // Make absolute URL if relative
        if (!empty($href) && strpos($href, 'http') !== 0) {
            $href = 'https://donboscoguwahati.org' . $href;
        }
        
        // Skip external links
        if (strpos($href, 'donboscoguwahati.org') === false) {
            continue;
        }
        
        // Try to extract month from link text or URL
        $month = null;
        $monthIndex = 0;
        
        foreach ($monthNames as $idx => $monthName) {
            if (stripos($text, $monthName) !== false || stripos($href, $monthName) !== false) {
                $month = $idx + 1;
                $monthIndex = $idx;
                break;
            }
        }
        
        // If month not found in text, try to extract from filename
        if (!$month) {
            $filename = basename(parse_url($href, PHP_URL_PATH));
            foreach ($monthNames as $idx => $monthName) {
                if (stripos($filename, $monthName) !== false || 
                    stripos($filename, substr($monthName, 0, 3)) !== false) {
                    $month = $idx + 1;
                    $monthIndex = $idx;
                    break;
                }
            }
        }
        
        // If still not found, try numeric month in filename (e.g., "01", "1", "jan", etc.)
        if (!$month) {
            if (preg_match('/(?:^|[_-])(0?[1-9]|1[0-2])(?:[_-]|$)/', $filename, $matches)) {
                $month = intval($matches[1]);
            }
        }
        
        if ($month && $month >= 1 && $month <= 12) {
            // Check if we already have this month
            if (!isset($monthlyCirculars[$month])) {
                $monthlyCirculars[$month] = [
                    'month' => $month,
                    'year' => $year,
                    'title' => ucfirst($monthNames[$monthIndex]) . ' ' . $year,
                    'pdf_url' => $href,
                    'description' => "Provincial Circular for " . ucfirst($monthNames[$monthIndex]) . " $year"
                ];
            }
        }
    }
    
    // Also look for month names in text links
    $textLinks = $xpath->query("//a[contains(@href, 'circular') or contains(@href, '$year')]");
    foreach ($textLinks as $link) {
        $href = $link->getAttribute('href');
        $text = trim($link->textContent);
        
        foreach ($monthNames as $idx => $monthName) {
            if (stripos($text, $monthName) !== false && stripos($text, (string)$year) !== false) {
                $month = $idx + 1;
                
                // Check if there's a PDF link nearby
                $parent = $link->parentNode;
                if ($parent) {
                    $pdfLinksInParent = $xpath->query(".//a[contains(@href, '.pdf')]", $parent);
                    if ($pdfLinksInParent->length > 0) {
                        $pdfUrl = $pdfLinksInParent->item(0)->getAttribute('href');
                        if (!empty($pdfUrl) && strpos($pdfUrl, 'http') !== 0) {
                            $pdfUrl = 'https://donboscoguwahati.org' . $pdfUrl;
                        }
                        
                        if (!isset($monthlyCirculars[$month])) {
                            $monthlyCirculars[$month] = [
                                'month' => $month,
                                'year' => $year,
                                'title' => ucfirst($monthName) . ' ' . $year,
                                'pdf_url' => $pdfUrl,
                                'description' => "Provincial Circular for " . ucfirst($monthName) . " $year"
                            ];
                        }
                    }
                }
            }
        }
    }
    
    return $monthlyCirculars;
}

/**
 * Download PDF and return local path
 */
function downloadPDF($url, $year, $month) {
    global $UPLOAD_DIR;
    
    if (empty($url)) {
        return null;
    }
    
    try {
        $monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
        $monthName = strtolower($monthNames[$month - 1]);
        $filename = $monthName . '-' . $year . '.pdf';
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

// Main migration process
try {
    logMessage("Starting monthly circulars migration...");
    
    $db = Database::getInstance()->getConnection();
    
    // Years to process
    $years = [2025, 2024, 2023, 2022, 2021, 2020, 2019];
    
    foreach ($years as $year) {
        logMessage("Processing year: $year");
        
        // Try different URL patterns for the year page
        $urls = [
            $WORDPRESS_BASE_URL . "/index.php/$year-4/",
            $WORDPRESS_BASE_URL . "/index.php/provincial-circular/$year/",
            $WORDPRESS_BASE_URL . "/index.php/category/circulars/$year/",
        ];
        
        $html = null;
        $url = null;
        
        foreach ($urls as $tryUrl) {
            try {
                logMessage("Trying URL: $tryUrl");
                $html = fetchUrl($tryUrl);
                $url = $tryUrl;
                break;
            } catch (Exception $e) {
                logMessage("Failed to fetch $tryUrl: " . $e->getMessage());
                continue;
            }
        }
        
        if (!$html) {
            logMessage("Could not fetch page for year $year, skipping...");
            continue;
        }
        
        // Extract monthly circulars
        $monthlyCirculars = extractMonthlyCirculars($html, $year);
        logMessage("Found " . count($monthlyCirculars) . " monthly circulars for $year");
        
        // Process each monthly circular
        foreach ($monthlyCirculars as $circular) {
            try {
                // Check if already exists
                $checkStmt = $db->prepare("SELECT id FROM circulars WHERE year = :year AND month = :month AND deleted_at IS NULL");
                $checkStmt->execute(['year' => $circular['year'], 'month' => $circular['month']]);
                if ($checkStmt->fetch()) {
                    logMessage("Circular already exists: {$circular['title']}");
                    continue;
                }
                
                // Download PDF
                $pdfPath = downloadPDF($circular['pdf_url'], $circular['year'], $circular['month']);
                
                if (!$pdfPath) {
                    logMessage("Failed to download PDF for {$circular['title']}, skipping...");
                    continue;
                }
                
                // Insert into database
                $stmt = $db->prepare("
                    INSERT INTO circulars (title, month, year, file_path, description, is_active)
                    VALUES (:title, :month, :year, :file_path, :description, :is_active)
                ");
                
                $stmt->execute([
                    'title' => $circular['title'],
                    'month' => $circular['month'],
                    'year' => $circular['year'],
                    'file_path' => $pdfPath,
                    'description' => $circular['description'],
                    'is_active' => 1
                ]);
                
                $id = $db->lastInsertId();
                logMessage("✓ Created circular: {$circular['title']} (ID: $id)");
                
                // Small delay
                usleep(500000); // 0.5 seconds
                
            } catch (Exception $e) {
                logMessage("Error processing {$circular['title']}: " . $e->getMessage());
                continue;
            }
        }
    }
    
    logMessage("Migration completed!");
    
} catch (Exception $e) {
    logMessage("Fatal error: " . $e->getMessage());
    exit(1);
}

fclose($log);
echo "\nMigration log saved to: $LOG_FILE\n";

