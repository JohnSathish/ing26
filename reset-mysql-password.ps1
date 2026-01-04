# MySQL Password Reset Script for XAMPP
# Run this script as Administrator

Write-Host "MySQL Password Reset Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$mysqlPath = "C:\xampp\mysql\bin"
$mysqlExe = Join-Path $mysqlPath "mysql.exe"
$mysqldExe = Join-Path $mysqlPath "mysqld.exe"

if (-not (Test-Path $mysqlExe)) {
    Write-Host "ERROR: XAMPP MySQL not found at $mysqlPath" -ForegroundColor Red
    Write-Host "Please update the path in this script if XAMPP is installed elsewhere." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Stopping MySQL service..." -ForegroundColor Yellow
try {
    Stop-Service -Name "MySQL" -ErrorAction SilentlyContinue
    Write-Host "MySQL service stopped." -ForegroundColor Green
} catch {
    Write-Host "MySQL service may not be running as a Windows service." -ForegroundColor Yellow
    Write-Host "Please stop MySQL from XAMPP Control Panel manually." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key after you've stopped MySQL from XAMPP..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host ""
Write-Host "Step 2: Starting MySQL in safe mode..." -ForegroundColor Yellow
Write-Host "This will open a new window. Keep it open!" -ForegroundColor Cyan
Write-Host ""

$safeModeProcess = Start-Process -FilePath $mysqldExe -ArgumentList "--skip-grant-tables", "--console" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "Step 3: Connecting to MySQL..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Choose an option:" -ForegroundColor Cyan
Write-Host "1. Set password to 'john@1991js' (matches your database.php)" -ForegroundColor White
Write-Host "2. Set password to empty (no password)" -ForegroundColor White
Write-Host "3. Set custom password" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1-3)"

$newPassword = ""
switch ($choice) {
    "1" { 
        $newPassword = "john@1991js"
        Write-Host "Setting password to: $newPassword" -ForegroundColor Green
    }
    "2" { 
        $newPassword = ""
        Write-Host "Setting password to empty (no password)" -ForegroundColor Green
    }
    "3" { 
        $newPassword = Read-Host "Enter new password" -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($newPassword)
        $newPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        Stop-Process -Id $safeModeProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }
}

Write-Host ""
Write-Host "Step 4: Resetting password..." -ForegroundColor Yellow

if ($newPassword -eq "") {
    $sqlCommands = @"
USE mysql;
UPDATE user SET authentication_string='' WHERE User='root';
FLUSH PRIVILEGES;
EXIT;
"@
} else {
    $sqlCommands = @"
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY '$newPassword';
FLUSH PRIVILEGES;
EXIT;
"@
}

$sqlFile = Join-Path $env:TEMP "reset_password.sql"
$sqlCommands | Out-File -FilePath $sqlFile -Encoding ASCII

try {
    # PowerShell way to pipe file content to command
    Get-Content $sqlFile | & $mysqlExe -u root
    Write-Host "Password reset successful!" -ForegroundColor Green
} catch {
    Write-Host "Error resetting password. You may need to run the SQL commands manually." -ForegroundColor Red
    Write-Host ""
    Write-Host "SQL Commands to run:" -ForegroundColor Yellow
    Write-Host $sqlCommands
}

Remove-Item $sqlFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Step 5: Stopping safe mode MySQL..." -ForegroundColor Yellow
Stop-Process -Id $safeModeProcess.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 6: Please start MySQL from XAMPP Control Panel" -ForegroundColor Yellow
Write-Host ""
Write-Host "After starting MySQL, test the connection:" -ForegroundColor Cyan
if ($newPassword -eq "") {
    Write-Host "  mysql -u root" -ForegroundColor White
} else {
    Write-Host "  mysql -u root -p" -ForegroundColor White
    Write-Host "  (Enter password: $newPassword)" -ForegroundColor White
}
Write-Host ""
Write-Host "Don't forget to update database.php if you changed the password!" -ForegroundColor Yellow

