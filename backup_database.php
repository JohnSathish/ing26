<?php
/**
 * Database Backup Script
 * Creates a SQL dump of the entire database
 */

if (!defined('API_ACCESS')) { define('API_ACCESS', true); }

require_once __DIR__ . '/public_html/api/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get database name from connection
    $dbName = $db->query('SELECT DATABASE()')->fetchColumn();
    
    if (empty($dbName)) {
        throw new Exception('Could not determine database name');
    }
    
    echo "=== Database Backup ===\n";
    echo "Database: {$dbName}\n\n";
    
    // Create backup directory if it doesn't exist
    $backupDir = __DIR__ . '/database/backups';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    // Generate backup filename with timestamp
    $timestamp = date('Y-m-d_H-i-s');
    $backupFile = $backupDir . '/backup_' . $dbName . '_' . $timestamp . '.sql';
    
    echo "Creating backup...\n";
    
    // Get database credentials from constants (already defined)
    $host = defined('DB_HOST') ? DB_HOST : 'localhost';
    $username = defined('DB_USER') ? DB_USER : 'root';
    $password = defined('DB_PASS') ? DB_PASS : 'john@1991js';
    $database = $dbName;
    
    // Check if mysqldump is available
    $mysqldumpPath = '';
    $paths = [
        'mysqldump',
        'C:\\xampp\\mysql\\bin\\mysqldump.exe',
        'C:\\wamp\\bin\\mysql\\mysql8.0.xx\\bin\\mysqldump.exe',
    ];
    
    foreach ($paths as $path) {
        if (is_executable($path) || shell_exec("where {$path} 2>nul")) {
            $mysqldumpPath = $path;
            break;
        }
    }
    
    if (empty($mysqldumpPath)) {
        // Try to find mysqldump in PATH
        $output = shell_exec('where mysqldump 2>nul');
        if (!empty($output)) {
            $mysqldumpPath = trim($output);
        }
    }
    
    if (!empty($mysqldumpPath)) {
        // Use mysqldump (faster and more reliable)
        echo "Using mysqldump: {$mysqldumpPath}\n";
        
        $command = sprintf(
            '"%s" --host=%s --user=%s --password=%s --single-transaction --routines --triggers %s > "%s" 2>&1',
            $mysqldumpPath,
            escapeshellarg($host),
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($database),
            escapeshellarg($backupFile)
        );
        
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0 && file_exists($backupFile) && filesize($backupFile) > 0) {
            $fileSize = filesize($backupFile);
            echo "✅ Backup created successfully!\n";
            echo "   File: {$backupFile}\n";
            echo "   Size: " . number_format($fileSize / 1024, 2) . " KB\n";
        } else {
            throw new Exception("mysqldump failed. Return code: {$returnCode}");
        }
    } else {
        // Fallback: Export via PHP (slower but works without mysqldump)
        echo "mysqldump not found, using PHP export (this may take longer)...\n";
        
        $fp = fopen($backupFile, 'w');
        
        if (!$fp) {
            throw new Exception("Could not create backup file: {$backupFile}");
        }
        
        // Write header
        fwrite($fp, "-- Database Backup\n");
        fwrite($fp, "-- Database: {$database}\n");
        fwrite($fp, "-- Created: " . date('Y-m-d H:i:s') . "\n");
        fwrite($fp, "--\n\n");
        fwrite($fp, "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n");
        fwrite($fp, "SET time_zone = \"+00:00\";\n\n");
        fwrite($fp, "/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n");
        fwrite($fp, "/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;\n");
        fwrite($fp, "/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;\n");
        fwrite($fp, "/*!40101 SET NAMES utf8mb4 */;\n\n");
        
        // Get all tables
        $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        
        echo "Exporting " . count($tables) . " tables...\n";
        
        foreach ($tables as $table) {
            echo "  Exporting table: {$table}...\n";
            
            // Get table structure
            fwrite($fp, "\n--\n-- Table structure for table `{$table}`\n--\n\n");
            fwrite($fp, "DROP TABLE IF EXISTS `{$table}`;\n");
            
            $createTable = $db->query("SHOW CREATE TABLE `{$table}`")->fetch(PDO::FETCH_ASSOC);
            fwrite($fp, $createTable['Create Table'] . ";\n\n");
            
            // Get table data
            $rows = $db->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($rows) > 0) {
                fwrite($fp, "--\n-- Dumping data for table `{$table}`\n--\n\n");
                
                $columns = array_keys($rows[0]);
                $columnList = '`' . implode('`, `', $columns) . '`';
                
                foreach ($rows as $row) {
                    $values = array_map(function($value) use ($db) {
                        if ($value === null) {
                            return 'NULL';
                        }
                        return $db->quote($value);
                    }, array_values($row));
                    
                    $valuesList = implode(', ', $values);
                    fwrite($fp, "INSERT INTO `{$table}` ({$columnList}) VALUES ({$valuesList});\n");
                }
                fwrite($fp, "\n");
            }
        }
        
        // Write footer
        fwrite($fp, "\n/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n");
        fwrite($fp, "/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n");
        fwrite($fp, "/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n");
        
        fclose($fp);
        
        $fileSize = filesize($backupFile);
        echo "✅ Backup created successfully!\n";
        echo "   File: {$backupFile}\n";
        echo "   Size: " . number_format($fileSize / 1024, 2) . " KB\n";
    }
    
    echo "\n=== Backup Complete ===\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
