# Restore Backup Script
# This script helps restore your project from a backup file

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupPath,
    
    [switch]$CreateSafetyBackup = $true
)

Write-Host "=== Backup Restore Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify backup file exists
if (-not (Test-Path $BackupPath)) {
    Write-Host "ERROR: Backup file not found at: $BackupPath" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Backup file found: $BackupPath" -ForegroundColor Green

# Step 2: Create safety backup of current state
if ($CreateSafetyBackup) {
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $safetyBackup = "safety_backup_$timestamp.zip"
    
    Write-Host ""
    Write-Host "Creating safety backup of current state..." -ForegroundColor Yellow
    Write-Host "This will be saved as: $safetyBackup" -ForegroundColor Yellow
    
    try {
        Compress-Archive -Path "frontend", "public_html" -DestinationPath $safetyBackup -Force
        Write-Host "✓ Safety backup created successfully!" -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Could not create safety backup: $_" -ForegroundColor Yellow
    }
}

# Step 3: Extract backup to temporary location
$tempExtract = "restore_temp_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host ""
Write-Host "Extracting backup to: $tempExtract" -ForegroundColor Yellow

try {
    if ($BackupPath -match '\.rar$') {
        Write-Host "RAR file detected. You may need WinRAR or 7-Zip to extract." -ForegroundColor Yellow
        Write-Host "Please extract manually and tell me the folder path." -ForegroundColor Yellow
        exit 1
    } else {
        Expand-Archive -Path $BackupPath -DestinationPath $tempExtract -Force
        Write-Host "✓ Backup extracted successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: Failed to extract backup: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Show what's in the backup
Write-Host ""
Write-Host "Contents of backup:" -ForegroundColor Cyan
Get-ChildItem -Path $tempExtract -Recurse -Directory | Select-Object -First 10 FullName
Get-ChildItem -Path $tempExtract -File | Select-Object -First 10 Name

# Step 5: Ask for confirmation
Write-Host ""
$confirm = Read-Host "Do you want to restore from this backup? (yes/no)"
if ($confirm -ne 'yes' -and $confirm -ne 'y') {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    Remove-Item -Path $tempExtract -Recurse -Force
    exit 0
}

# Step 6: Restore files
Write-Host ""
Write-Host "Restoring files..." -ForegroundColor Yellow

try {
    # Restore frontend if it exists in backup
    if (Test-Path "$tempExtract\frontend") {
        Write-Host "Restoring frontend..." -ForegroundColor Cyan
        Copy-Item -Path "$tempExtract\frontend\*" -Destination "frontend\" -Recurse -Force
        Write-Host "✓ Frontend restored!" -ForegroundColor Green
    }
    
    # Restore public_html if it exists in backup
    if (Test-Path "$tempExtract\public_html") {
        Write-Host "Restoring public_html..." -ForegroundColor Cyan
        Copy-Item -Path "$tempExtract\public_html\*" -Destination "public_html\" -Recurse -Force
        Write-Host "✓ public_html restored!" -ForegroundColor Green
    }
    
    # If backup is just public_html contents
    if ((Test-Path "$tempExtract\api") -and -not (Test-Path "$tempExtract\frontend")) {
        Write-Host "Restoring public_html contents..." -ForegroundColor Cyan
        Copy-Item -Path "$tempExtract\*" -Destination "public_html\" -Recurse -Force
        Write-Host "✓ public_html restored!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "ERROR during restore: $_" -ForegroundColor Red
    Write-Host "You can restore from safety backup if needed." -ForegroundColor Yellow
    exit 1
}

# Step 7: Cleanup
Write-Host ""
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Restore Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check if the site works: npm run dev (in frontend folder)" -ForegroundColor White
Write-Host "2. If something is wrong, restore from safety backup" -ForegroundColor White
Write-Host ""

