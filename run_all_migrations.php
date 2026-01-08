<?php
/**
 * Run all migration scripts safely
 * This script runs all migration scripts in the correct order with error handling
 */

ini_set('memory_limit', '1024M');
set_time_limit(0); // No time limit

define('API_ACCESS', true);

// Configuration
$LOG_FILE = __DIR__ . '/all_migrations_log.txt';

function logMessage($message, $prefix = '') {
    global $LOG_FILE;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $prefix$message\n";
    echo $logEntry;
    file_put_contents($LOG_FILE, $logEntry, FILE_APPEND);
}

function runMigrationScript($scriptPath, $scriptName) {
    logMessage("═══════════════════════════════════════════════════════════", "");
    logMessage("Starting: $scriptName", "");
    logMessage("═══════════════════════════════════════════════════════════", "");
    
    if (!file_exists($scriptPath)) {
        logMessage("✗ Script not found: $scriptPath", "");
        return ['success' => false, 'error' => 'Script not found'];
    }
    
    $startTime = microtime(true);
    
    // Run script via command line to avoid function conflicts
    $command = "php \"" . escapeshellarg($scriptPath) . "\" 2>&1";
    $output = [];
    $exitCode = 0;
    
    // Execute the script
    exec($command, $output, $exitCode);
    
    $outputString = implode("\n", $output);
    
    if ($outputString) {
        logMessage("Output:", "");
        // Split output into lines and log each
        $lines = explode("\n", $outputString);
        foreach ($lines as $line) {
            if (trim($line)) {
                logMessage($line, "  ");
            }
        }
    }
    
    $success = ($exitCode === 0);
    $error = null;
    
    if (!$success) {
        // Try to extract error message
        if (preg_match('/Fatal error: (.+)/', $outputString, $matches)) {
            $error = $matches[1];
        } elseif (preg_match('/Error: (.+)/', $outputString, $matches)) {
            $error = $matches[1];
        } else {
            $error = "Exit code: $exitCode";
        }
        logMessage("✗ Error: $error", "");
    }
    
    $endTime = microtime(true);
    $duration = round($endTime - $startTime, 2);
    
    if ($success) {
        logMessage("✓ Completed: $scriptName (Duration: {$duration}s)", "");
    } else {
        logMessage("✗ Failed: $scriptName (Duration: {$duration}s)", "");
    }
    
    logMessage("", "");
    
    return [
        'success' => $success,
        'duration' => $duration,
        'output' => $outputString,
        'error' => $error
    ];
}

// Main execution
logMessage("═══════════════════════════════════════════════════════════", "");
logMessage("STARTING ALL MIGRATIONS", "");
logMessage("═══════════════════════════════════════════════════════════", "");
logMessage("Start time: " . date('Y-m-d H:i:s'), "");
logMessage("", "");

$scripts = [
    [
        'name' => 'Migrate Hardcoded Pages',
        'file' => 'migrate_hardcoded_pages.php',
        'required' => false
    ],
    [
        'name' => 'Migrate Diocese Pages',
        'file' => 'migrate_diocese_pages.php',
        'required' => false
    ],
    [
        'name' => 'Migrate NewsLine Pages',
        'file' => 'migrate_newsline_pages.php',
        'required' => false
    ],
    [
        'name' => 'Migrate Circulars Pages',
        'file' => 'migrate_circulars_pages.php',
        'required' => false
    ],
    [
        'name' => 'Migrate Monthly Circulars',
        'file' => 'migrate_monthly_circulars.php',
        'required' => false
    ],
    [
        'name' => 'Migrate Economer Page',
        'file' => 'migrate_economer_page.php',
        'required' => false
    ],
    [
        'name' => 'Migrate Provincial Secretary Page',
        'file' => 'migrate_provincial_secretary_page.php',
        'required' => false
    ],
];

$results = [];
$totalStartTime = microtime(true);

foreach ($scripts as $script) {
    $scriptPath = __DIR__ . '/' . $script['file'];
    $result = runMigrationScript($scriptPath, $script['name']);
    
    $results[] = [
        'name' => $script['name'],
        'file' => $script['file'],
        'success' => $result['success'],
        'duration' => $result['duration'] ?? 0,
        'error' => $result['error'] ?? null
    ];
    
    // If a required script fails, stop execution
    if ($script['required'] && !$result['success']) {
        logMessage("⚠ REQUIRED SCRIPT FAILED - STOPPING MIGRATION", "");
        break;
    }
    
    // Small delay between scripts
    sleep(1);
}

$totalEndTime = microtime(true);
$totalDuration = round($totalEndTime - $totalStartTime, 2);

// Summary
logMessage("═══════════════════════════════════════════════════════════", "");
logMessage("MIGRATION SUMMARY", "");
logMessage("═══════════════════════════════════════════════════════════", "");

$successCount = 0;
$failedCount = 0;

foreach ($results as $result) {
    $status = $result['success'] ? '✓' : '✗';
    $duration = $result['duration'] ?? 0;
    logMessage("$status {$result['name']} ({$duration}s)", "  ");
    
    if ($result['success']) {
        $successCount++;
    } else {
        $failedCount++;
        if ($result['error']) {
            logMessage("    Error: {$result['error']}", "  ");
        }
    }
}

logMessage("", "");
logMessage("Total scripts: " . count($results), "");
logMessage("Successful: $successCount", "");
logMessage("Failed: $failedCount", "");
logMessage("Total duration: {$totalDuration}s", "");
logMessage("", "");
logMessage("═══════════════════════════════════════════════════════════", "");
logMessage("MIGRATIONS COMPLETED", "");
logMessage("═══════════════════════════════════════════════════════════", "");

exit($failedCount > 0 ? 1 : 0);

