<?php
/**
 * Cleanup News Links
 * Removes category and username links from migrated news content
 */

// Define API_ACCESS to bypass security checks
if (!defined('API_ACCESS')) { 
    define('API_ACCESS', true); 
}

require_once __DIR__ . '/public_html/api/config/database.php';
require_once __DIR__ . '/public_html/api/config/constants.php';

// Old WordPress site domain
$oldSiteDomain = 'donboscoguwahati.org';

// Log file
$logFile = 'cleanup_news_links_log.txt';

function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message\n";
    file_put_contents($logFile, $logMessage, FILE_APPEND);
    echo $logMessage;
}

function cleanHtmlContent($html, $oldDomain) {
    if (empty($html)) {
        return $html;
    }
    
    // Load HTML into DOMDocument
    $dom = new DOMDocument();
    
    // Suppress warnings for malformed HTML
    libxml_use_internal_errors(true);
    
    // Load HTML with UTF-8 encoding
    $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
    
    // Try to load as HTML fragment
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    
    // Clear libxml errors
    libxml_clear_errors();
    
    $xpath = new DOMXPath($dom);
    
    // Find all links
    $links = $xpath->query('//a[@href]');
    
    $linksRemoved = 0;
    $linksToOldSite = 0;
    
    foreach ($links as $link) {
        $href = $link->getAttribute('href');
        
        // Check if link points to old site
        if (strpos($href, $oldDomain) !== false) {
            $linksToOldSite++;
            
            // Get the link text
            $linkText = trim($link->textContent);
            
            // Check if it's a category or author link (common patterns)
            $isCategoryLink = (
                stripos($href, '/category/') !== false ||
                stripos($href, '/cat/') !== false ||
                stripos($href, 'category') !== false
            );
            
            $isAuthorLink = (
                stripos($href, '/author/') !== false ||
                stripos($href, '/user/') !== false ||
                stripos($href, 'author') !== false
            );
            
            // If it's a category or author link, remove the link but keep the text
            if ($isCategoryLink || $isAuthorLink) {
                // Replace link with just the text
                $textNode = $dom->createTextNode($linkText);
                $link->parentNode->replaceChild($textNode, $link);
                $linksRemoved++;
            } else {
                // For other links to old site, just remove the link but keep text
                $textNode = $dom->createTextNode($linkText);
                $link->parentNode->replaceChild($textNode, $link);
                $linksRemoved++;
            }
        }
    }
    
    // Get cleaned HTML
    $body = $dom->getElementsByTagName('body')->item(0);
    if ($body) {
        $cleanedHtml = '';
        foreach ($body->childNodes as $child) {
            $cleanedHtml .= $dom->saveHTML($child);
        }
    } else {
        $cleanedHtml = $html;
    }
    
    // Also clean any remaining href attributes in the HTML string
    $cleanedHtml = preg_replace_callback(
        '/<a\s+[^>]*href=["\']([^"\']*' . preg_quote($oldDomain, '/') . '[^"\']*)["\'][^>]*>(.*?)<\/a>/is',
        function($matches) {
            return $matches[2]; // Return just the link text
        },
        $cleanedHtml
    );
    
    return [
        'content' => $cleanedHtml,
        'links_removed' => $linksRemoved,
        'links_to_old_site' => $linksToOldSite
    ];
}

function cleanTextContent($text, $oldDomain) {
    if (empty($text)) {
        return $text;
    }
    
    // Remove any URLs containing the old domain
    $text = preg_replace(
        '/(https?:\/\/)?([a-zA-Z0-9.-]*\.)?' . preg_quote($oldDomain, '/') . '[^\s\)]*/i',
        '',
        $text
    );
    
    return trim($text);
}

try {
    logMessage("=== Starting News Links Cleanup ===");
    logMessage("Target domain: $oldSiteDomain");
    
    $db = Database::getInstance()->getConnection();
    
    // Get all news items
    $stmt = $db->query("SELECT id, title, content, excerpt FROM news WHERE deleted_at IS NULL");
    $newsItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $totalItems = count($newsItems);
    logMessage("Found $totalItems news items to process");
    
    $updated = 0;
    $totalLinksRemoved = 0;
    $totalLinksToOldSite = 0;
    
    foreach ($newsItems as $item) {
        $id = $item['id'];
        $title = $item['title'];
        $originalContent = $item['content'];
        $originalExcerpt = $item['excerpt'];
        
        $contentChanged = false;
        $excerptChanged = false;
        
        // Clean content
        if (!empty($originalContent)) {
            $contentResult = cleanHtmlContent($originalContent, $oldSiteDomain);
            $cleanedContent = $contentResult['content'];
            
            if ($cleanedContent !== $originalContent) {
                $contentChanged = true;
                $totalLinksRemoved += $contentResult['links_removed'];
                $totalLinksToOldSite += $contentResult['links_to_old_site'];
            }
        } else {
            $cleanedContent = $originalContent;
        }
        
        // Clean excerpt (usually plain text, but might have HTML)
        if (!empty($originalExcerpt)) {
            // Try HTML cleaning first
            $excerptResult = cleanHtmlContent($originalExcerpt, $oldSiteDomain);
            $cleanedExcerpt = $excerptResult['content'];
            
            // Also clean as plain text
            $cleanedExcerpt = cleanTextContent($cleanedExcerpt, $oldSiteDomain);
            
            if ($cleanedExcerpt !== $originalExcerpt) {
                $excerptChanged = true;
                $totalLinksRemoved += $excerptResult['links_removed'];
                $totalLinksToOldSite += $excerptResult['links_to_old_site'];
            }
        } else {
            $cleanedExcerpt = $originalExcerpt;
        }
        
        // Update if content or excerpt changed
        if ($contentChanged || $excerptChanged) {
            $updateStmt = $db->prepare("
                UPDATE news 
                SET content = :content, excerpt = :excerpt 
                WHERE id = :id
            ");
            
            $updateStmt->execute([
                'content' => $cleanedContent,
                'excerpt' => $cleanedExcerpt,
                'id' => $id
            ]);
            
            $updated++;
            logMessage("✓ Updated: $title (ID: $id)");
            
            if ($contentResult['links_removed'] > 0 || $excerptResult['links_removed'] > 0) {
                logMessage("  - Removed {$contentResult['links_removed']} links from content");
                logMessage("  - Removed {$excerptResult['links_removed']} links from excerpt");
            }
        }
    }
    
    logMessage("");
    logMessage("=== Cleanup Complete ===");
    logMessage("Total items processed: $totalItems");
    logMessage("Items updated: $updated");
    logMessage("Total links removed: $totalLinksRemoved");
    logMessage("Total links to old site found: $totalLinksToOldSite");
    logMessage("");
    logMessage("Cleanup completed successfully!");
    
} catch (Exception $e) {
    logMessage("ERROR: " . $e->getMessage());
    logMessage("Stack trace: " . $e->getTraceAsString());
    exit(1);
}

