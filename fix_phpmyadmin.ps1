# Fix phpMyAdmin Configuration Script

Write-Host "=== phpMyAdmin Configuration Fix ===" -ForegroundColor Cyan
Write-Host ""

# Your database credentials
$dbUser = "root"
$dbPass = "john@1991js"
$dbHost = "localhost"

# Common phpMyAdmin locations
$possiblePaths = @(
    "C:\xampp\phpMyAdmin\config.inc.php",
    "C:\wamp64\apps\phpmyadmin\config.inc.php",
    "C:\wamp\apps\phpmyadmin\config.inc.php",
    "C:\phpMyAdmin\config.inc.php",
    "$env:ProgramFiles\phpMyAdmin\config.inc.php"
)

Write-Host "Searching for phpMyAdmin config file..." -ForegroundColor Yellow

$configPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $configPath = $path
        Write-Host "✓ Found: $path" -ForegroundColor Green
        break
    }
}

if (-not $configPath) {
    Write-Host ""
    Write-Host "⚠ phpMyAdmin config.inc.php not found in common locations." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please provide the path to your phpMyAdmin config.inc.php file:" -ForegroundColor Cyan
    Write-Host "Common locations:" -ForegroundColor White
    Write-Host "  - XAMPP: C:\xampp\phpMyAdmin\config.inc.php" -ForegroundColor Gray
    Write-Host "  - WAMP: C:\wamp64\apps\phpmyadmin\config.inc.php" -ForegroundColor Gray
    Write-Host ""
    $manualPath = Read-Host "Enter full path to config.inc.php (or press Enter to skip)"
    if ($manualPath -and (Test-Path $manualPath)) {
        $configPath = $manualPath
    }
}

if ($configPath) {
    Write-Host ""
    Write-Host "Backing up current config..." -ForegroundColor Yellow
    $backupPath = "$configPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item -Path $configPath -Destination $backupPath -Force
    Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Reading current config..." -ForegroundColor Yellow
    $configContent = Get-Content -Path $configPath -Raw
    
    # Update server configuration
    Write-Host "Updating configuration..." -ForegroundColor Yellow
    
    # Update password
    if ($configContent -match "(\$cfg\['Servers'\]\[\d+\]\['password'\]\s*=\s*)['\"][^'\"]*['\"]") {
        $configContent = $configContent -replace "(\$cfg\['Servers'\]\[\d+\]\['password'\]\s*=\s*)['\"][^'\"]*['\"]", "`$1'$dbPass'"
        Write-Host "  ✓ Updated password" -ForegroundColor Green
    } else {
        # Add password if not exists
        if ($configContent -match "(\$cfg\['Servers'\]\[\d+\]\['user'\]\s*=\s*['\"]root['\"];)") {
            $configContent = $configContent -replace "(\$cfg\['Servers'\]\[\d+\]\['user'\]\s*=\s*['\"]root['\"];)", "`$1`n`$cfg['Servers'][1]['password'] = '$dbPass';"
            Write-Host "  ✓ Added password" -ForegroundColor Green
        }
    }
    
    # Update auth_type to 'config'
    if ($configContent -match "(\$cfg\['Servers'\]\[\d+\]\['auth_type'\]\s*=\s*)['\"][^'\"]*['\"]") {
        $configContent = $configContent -replace "(\$cfg\['Servers'\]\[\d+\]\['auth_type'\]\s*=\s*)['\"][^'\"]*['\"]", "`$1'config'"
        Write-Host "  ✓ Updated auth_type to 'config'" -ForegroundColor Green
    } else {
        # Add auth_type if not exists
        if ($configContent -match "(\$cfg\['Servers'\]\[\d+\]\['host'\]\s*=\s*['\"]localhost['\"];)") {
            $configContent = $configContent -replace "(\$cfg\['Servers'\]\[\d+\]\['host'\]\s*=\s*['\"]localhost['\"];)", "`$1`n`$cfg['Servers'][1]['auth_type'] = 'config';"
            Write-Host "  ✓ Added auth_type" -ForegroundColor Green
        }
    }
    
    # Update control user password
    if ($configContent -match "(\$cfg\['Servers'\]\[\d+\]\['controlpass'\]\s*=\s*)['\"][^'\"]*['\"]") {
        $configContent = $configContent -replace "(\$cfg\['Servers'\]\[\d+\]\['controlpass'\]\s*=\s*)['\"][^'\"]*['\"]", "`$1'$dbPass'"
        Write-Host "  ✓ Updated control user password" -ForegroundColor Green
    }
    
    # Save updated config
    Set-Content -Path $configPath -Value $configContent -NoNewline
    Write-Host ""
    Write-Host "✓ Configuration updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Refresh phpMyAdmin in your browser" -ForegroundColor White
    Write-Host "2. It should now connect with:" -ForegroundColor White
    Write-Host "   Username: root" -ForegroundColor Gray
    Write-Host "   Password: $dbPass" -ForegroundColor Gray
    Write-Host ""
    Write-Host "If it still doesn't work, restore from backup:" -ForegroundColor Yellow
    Write-Host "  Copy-Item '$backupPath' -Destination '$configPath' -Force" -ForegroundColor Gray
    
} else {
    Write-Host ""
    Write-Host "⚠ Could not find phpMyAdmin config file." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual fix instructions:" -ForegroundColor Cyan
    Write-Host "1. Find your phpMyAdmin config.inc.php file" -ForegroundColor White
    Write-Host "2. Open it in a text editor" -ForegroundColor White
    Write-Host "3. Update these lines:" -ForegroundColor White
    Write-Host ""
    Write-Host "   `$cfg['Servers'][1]['user'] = 'root';" -ForegroundColor Gray
    Write-Host "   `$cfg['Servers'][1]['password'] = '$dbPass';" -ForegroundColor Gray
    Write-Host "   `$cfg['Servers'][1]['auth_type'] = 'config';" -ForegroundColor Gray
    Write-Host "   `$cfg['Servers'][1]['controluser'] = 'root';" -ForegroundColor Gray
    Write-Host "   `$cfg['Servers'][1]['controlpass'] = '$dbPass';" -ForegroundColor Gray
    Write-Host ""
}

