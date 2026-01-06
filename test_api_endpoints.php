<?php
/**
 * Test API Endpoints
 * Run this to check if API endpoints are working
 */

echo "=== API Endpoints Test ===\n\n";

$baseUrl = "http://localhost:8000/api";

$endpoints = [
    'Auth Check' => '/auth/check',
    'Banners (Hero)' => '/banners/list?type=hero',
    'Banners (Flash News)' => '/banners/list?type=flash_news',
    'News List' => '/news/list?limit=4',
    'Collaborations' => '/collaborations/list',
];

foreach ($endpoints as $name => $endpoint) {
    echo "Testing: $name\n";
    echo "URL: $baseUrl$endpoint\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "❌ ERROR: $error\n";
    } elseif ($httpCode === 200) {
        $data = json_decode($response, true);
        if ($data && isset($data['success'])) {
            $count = isset($data['data']) ? count($data['data']) : 0;
            echo "✅ SUCCESS: HTTP $httpCode - Found $count items\n";
        } else {
            echo "⚠️  WARNING: HTTP $httpCode but unexpected response format\n";
            echo "Response: " . substr($response, 0, 100) . "...\n";
        }
    } else {
        echo "❌ FAILED: HTTP $httpCode\n";
        echo "Response: " . substr($response, 0, 200) . "\n";
    }
    
    echo "\n";
}

echo "=== Test Complete ===\n";
echo "\nIf all tests fail, make sure PHP server is running:\n";
echo "  cd public_html\n";
echo "  php -S localhost:8000 api/router.php\n";

