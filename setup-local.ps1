# Quick Local Setup Script for Windows
# CMD ING Guwahati - Local Development Setup

Write-Host "=== CMD ING Guwahati - Local Setup ===" -ForegroundColor Green

# Check PHP
Write-Host "`n1. Checking PHP..." -ForegroundColor Yellow
try {
    $phpVersion = php -v 2>&1 | Select-String "PHP" | Select-Object -First 1
    if ($phpVersion) {
        Write-Host "   ✓ PHP found: $phpVersion" -ForegroundColor Green
    } else {
        Write-Host "   ✗ PHP not found. Install PHP or use XAMPP." -ForegroundColor Red
        Write-Host "   Download XAMPP from: https://www.apachefriends.org/" -ForegroundColor Yellow
        exit
    }
} catch {
    Write-Host "   ✗ PHP not found. Install PHP or use XAMPP." -ForegroundColor Red
    Write-Host "   Download XAMPP from: https://www.apachefriends.org/" -ForegroundColor Yellow
    exit
}

# Check Node.js
Write-Host "`n2. Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v 2>&1
    if ($nodeVersion) {
        Write-Host "   ✓ Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Node.js not found. Install from nodejs.org" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "   ✗ Node.js not found. Install from nodejs.org" -ForegroundColor Red
    exit
}

# Check npm
Write-Host "`n3. Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v 2>&1
    Write-Host "   ✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ npm not found" -ForegroundColor Red
    exit
}

# Create uploads directory
Write-Host "`n4. Creating uploads directory..." -ForegroundColor Yellow
if (-not (Test-Path "public_html\uploads")) {
    New-Item -ItemType Directory -Path "public_html\uploads" -Force | Out-Null
    Write-Host "   ✓ Uploads directory created" -ForegroundColor Green
} else {
    Write-Host "   ✓ Uploads directory already exists" -ForegroundColor Green
}

# Check if database config exists
Write-Host "`n5. Checking database configuration..." -ForegroundColor Yellow
if (Test-Path "public_html\api\config\database.php") {
    Write-Host "   ✓ Database config file exists" -ForegroundColor Green
    Write-Host "   ⚠ Remember to update database credentials!" -ForegroundColor Yellow
} else {
    Write-Host "   ✗ Database config file not found" -ForegroundColor Red
}

# Generate admin password hash
Write-Host "`n6. Generating admin password hash..." -ForegroundColor Yellow
$password = "admin123"
try {
    $hash = php -r "echo password_hash('$password', PASSWORD_BCRYPT, ['cost' => 12]);" 2>&1
    if ($hash -and $hash.Length -gt 20) {
        Write-Host "   ✓ Password hash generated" -ForegroundColor Green
        Write-Host "`n   Admin Credentials:" -ForegroundColor Cyan
        Write-Host "   Username: admin" -ForegroundColor White
        Write-Host "   Password: $password" -ForegroundColor White
        Write-Host "`n   SQL to create admin user (run in phpMyAdmin or MySQL):" -ForegroundColor Yellow
        Write-Host "   INSERT INTO admins (username, password_hash, role) VALUES ('admin', '$hash', 'admin');" -ForegroundColor White
    } else {
        Write-Host "   ⚠ Could not generate hash. You can generate it manually:" -ForegroundColor Yellow
        Write-Host "   php -r `"echo password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);`"" -ForegroundColor White
    }
} catch {
    Write-Host "   ⚠ Could not generate hash automatically" -ForegroundColor Yellow
}

# Check if frontend dependencies are installed
Write-Host "`n7. Checking frontend dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "   ✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Frontend dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: cd frontend && npm install" -ForegroundColor White
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Install XAMPP (if not using standalone MySQL)" -ForegroundColor White
Write-Host "   Download: https://www.apachefriends.org/" -ForegroundColor Cyan
Write-Host "`n2. Start MySQL and create database:" -ForegroundColor White
Write-Host "   - Open phpMyAdmin: http://localhost/phpmyadmin" -ForegroundColor Cyan
Write-Host "   - Create database: cmd_ing_guwahati" -ForegroundColor Cyan
Write-Host "   - Import: database\schema.sql" -ForegroundColor Cyan
Write-Host "   - Run SQL to create admin user (see above)" -ForegroundColor Cyan
Write-Host "`n3. Update database credentials in:" -ForegroundColor White
Write-Host "   public_html\api\config\database.php" -ForegroundColor Cyan
Write-Host "`n4. Set development mode in:" -ForegroundColor White
Write-Host "   public_html\api\config\constants.php" -ForegroundColor Cyan
Write-Host "   Change: define('ENVIRONMENT', 'development');" -ForegroundColor Cyan
Write-Host "`n5. Start PHP server (Terminal 1):" -ForegroundColor White
Write-Host "   cd public_html" -ForegroundColor Cyan
Write-Host "   php -S localhost:8000" -ForegroundColor Cyan
Write-Host "`n6. Start React dev server (Terminal 2):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host "`n7. Open browser:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Cyan
Write-Host "`nFor detailed instructions, see: WINDOWS_SETUP.md" -ForegroundColor Yellow


