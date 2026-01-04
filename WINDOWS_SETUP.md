# Windows Local Setup Guide

## Option 1: Using XAMPP (Recommended for Windows)

XAMPP includes Apache, MySQL, and PHP - everything you need!

### Step 1: Install XAMPP
1. Download from https://www.apachefriends.org/
2. Install to `C:\xampp` (default location)
3. Start XAMPP Control Panel

### Step 2: Start Services
1. Open XAMPP Control Panel
2. Click "Start" for **Apache** and **MySQL**
3. Both should show green "Running" status

### Step 3: Access phpMyAdmin
1. Open browser: `http://localhost/phpmyadmin`
2. Create database: Click "New" → Name: `cmd_ing_guwahati` → Create

### Step 4: Import Database Schema
1. In phpMyAdmin, select `cmd_ing_guwahati` database
2. Click "Import" tab
3. Choose file: `database/schema.sql`
4. Click "Go"

### Step 5: Create Admin User
1. In phpMyAdmin, click "SQL" tab
2. Run this (replace `YOUR_HASH` with generated hash):

```sql
-- First, generate password hash using PowerShell:
-- php -r "echo password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);"

INSERT INTO admins (username, password_hash, role) 
VALUES ('admin', 'YOUR_HASH_HERE', 'admin');
```

### Step 6: Configure Application

1. **Update database config** (`public_html/api/config/database.php`):
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'cmd_ing_guwahati');
define('DB_USER', 'root');
define('DB_PASS', '');  // XAMPP default is empty
```

2. **Set development mode** (`public_html/api/config/constants.php`):
```php
define('ENVIRONMENT', 'development');
```

3. **Create uploads directory**:
```powershell
New-Item -ItemType Directory -Path "public_html\uploads" -Force
```

### Step 7: Copy Files to XAMPP

```powershell
# Copy public_html contents to XAMPP htdocs
Copy-Item -Path "public_html\*" -Destination "C:\xampp\htdocs\" -Recurse -Force
```

### Step 8: Start React Dev Server

```powershell
cd frontend
npm run dev
```

### Step 9: Access Application

- **Frontend (React)**: `http://localhost:5173`
- **Backend (PHP)**: `http://localhost/api/`
- **phpMyAdmin**: `http://localhost/phpmyadmin`

---

## Option 2: Using WAMP (Alternative)

Similar to XAMPP but Windows-specific.

1. Download from https://www.wampserver.com/
2. Install and start WAMP
3. Follow similar steps as XAMPP
4. Access via `http://localhost`

---

## Option 3: Standalone MySQL + PHP

### Install MySQL

1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Choose "Developer Default" or "Server only"
3. During installation, set root password (remember it!)
4. Add MySQL to PATH (or use full path)

### Add MySQL to PATH (if not auto-added)

```powershell
# Add to PATH temporarily for this session
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Or add permanently (run as Administrator):
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\MySQL\MySQL Server 8.0\bin", "Machine")
```

### Create Database

```powershell
# Using full path if not in PATH
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "CREATE DATABASE cmd_ing_guwahati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Or if in PATH:
mysql -u root -p -e "CREATE DATABASE cmd_ing_guwahati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Import Schema

```powershell
# Using full path
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p cmd_ing_guwahati < database\schema.sql

# Or if in PATH:
mysql -u root -p cmd_ing_guwahati < database\schema.sql
```

---

## Option 4: Quick Test Without Database (Frontend Only)

If you just want to test the React UI without backend:

```powershell
cd frontend
npm run dev
```

The app will load at `http://localhost:5173` but API calls will fail. You can still see the UI components.

---

## Quick Setup Script (PowerShell)

Save this as `setup-local.ps1`:

```powershell
# Quick Local Setup Script
Write-Host "=== CMD ING Guwahati - Local Setup ===" -ForegroundColor Green

# Check PHP
Write-Host "`n1. Checking PHP..." -ForegroundColor Yellow
$phpVersion = php -v 2>&1 | Select-String "PHP"
if ($phpVersion) {
    Write-Host "   ✓ PHP found: $phpVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ PHP not found. Install PHP or use XAMPP." -ForegroundColor Red
    exit
}

# Check Node.js
Write-Host "`n2. Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node -v 2>&1
if ($nodeVersion) {
    Write-Host "   ✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Node.js not found. Install from nodejs.org" -ForegroundColor Red
    exit
}

# Create uploads directory
Write-Host "`n3. Creating uploads directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "public_html\uploads" -Force | Out-Null
Write-Host "   ✓ Uploads directory created" -ForegroundColor Green

# Generate admin password hash
Write-Host "`n4. Generating admin password hash..." -ForegroundColor Yellow
$password = "admin123"
$hash = php -r "echo password_hash('$password', PASSWORD_BCRYPT, ['cost' => 12]);"
Write-Host "   Password: $password" -ForegroundColor Cyan
Write-Host "   Hash: $hash" -ForegroundColor Cyan
Write-Host "`n   Copy this SQL to create admin user:" -ForegroundColor Yellow
Write-Host "   INSERT INTO admins (username, password_hash, role) VALUES ('admin', '$hash', 'admin');" -ForegroundColor White

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Start MySQL (XAMPP/WAMP or standalone)" -ForegroundColor White
Write-Host "2. Create database and import schema.sql" -ForegroundColor White
Write-Host "3. Run: cd public_html && php -S localhost:8000" -ForegroundColor White
Write-Host "4. Run: cd frontend && npm run dev" -ForegroundColor White
```

Run it:
```powershell
.\setup-local.ps1
```

---

## Testing Checklist

### 1. Test PHP Server
```powershell
cd public_html
php -S localhost:8000
```
Visit: `http://localhost:8000/api/auth/check`
Should return: `{"authenticated":false}`

### 2. Test React App
```powershell
cd frontend
npm run dev
```
Visit: `http://localhost:5173`
Should show the homepage

### 3. Test Database Connection
```powershell
php test-api.php
```

---

## Common Issues

### "mysql is not recognized"
- Use XAMPP/WAMP (includes MySQL)
- Or add MySQL to PATH
- Or use full path: `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`

### "Access denied for user 'root'"
- Check password in `database.php`
- XAMPP default: empty password
- Standalone MySQL: use password you set during installation

### "Port 8000 already in use"
- Change port in PHP server: `php -S localhost:8001`
- Update Vite proxy in `vite.config.ts` to match

### CORS Errors
- Make sure `ENVIRONMENT` is set to `'development'` in `constants.php`
- Check that CORS handling in `api/index.php` is working

---

## Recommended: XAMPP Setup

For Windows, XAMPP is the easiest option:

1. ✅ One installer (Apache + MySQL + PHP)
2. ✅ Visual control panel
3. ✅ phpMyAdmin included
4. ✅ No PATH configuration needed
5. ✅ Works out of the box

Just install, start services, and you're ready!


