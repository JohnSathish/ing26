# Fix phpMyAdmin Connection Issues

## The Problem

phpMyAdmin is showing these errors:
- Access denied for user 'pma'@'localhost' (using password: NO)
- Access denied for user 'root'@'localhost' (using password: YES)
- Connection for controluser failed

## Your Database Credentials (from config)

- **Host:** localhost
- **Username:** root
- **Password:** john@1991js
- **Database:** cmd_ing_guwahati

## Solutions

### Solution 1: Start MySQL Service

**If using XAMPP:**
1. Open XAMPP Control Panel
2. Start MySQL service
3. Wait for it to turn green

**If using standalone MySQL:**
```powershell
# Check if MySQL service exists
Get-Service -Name "*mysql*"

# Start MySQL service (replace with actual service name)
Start-Service -Name "MySQL80"  # or "MySQL" or "MariaDB"
```

### Solution 2: Fix phpMyAdmin Configuration

phpMyAdmin config file is usually located at:
- XAMPP: `C:\xampp\phpMyAdmin\config.inc.php`
- WAMP: `C:\wamp64\apps\phpmyadmin\config.inc.php`
- Standalone: Check your phpMyAdmin installation folder

**Update the config.inc.php file:**

```php
<?php
// ... existing code ...

// Server configuration
$cfg['Servers'][1]['host'] = 'localhost';
$cfg['Servers'][1]['user'] = 'root';
$cfg['Servers'][1]['password'] = 'john@1991js';  // Your password
$cfg['Servers'][1]['auth_type'] = 'config';     // Use 'config' for local development

// Control user (for advanced features - optional)
$cfg['Servers'][1]['controluser'] = 'root';
$cfg['Servers'][1]['controlpass'] = 'john@1991js';

// ... rest of config ...
```

### Solution 3: Reset MySQL Root Password

If the password doesn't work, you may need to reset it:

**Using XAMPP:**
1. Stop MySQL in XAMPP Control Panel
2. Open Command Prompt as Administrator
3. Navigate to MySQL bin folder:
   ```cmd
   cd C:\xampp\mysql\bin
   ```
4. Start MySQL in safe mode:
   ```cmd
   mysqld --skip-grant-tables
   ```
5. Open another Command Prompt and connect:
   ```cmd
   mysql -u root
   ```
6. Reset password:
   ```sql
   USE mysql;
   UPDATE user SET authentication_string=PASSWORD('john@1991js') WHERE User='root';
   FLUSH PRIVILEGES;
   EXIT;
   ```
7. Stop the safe mode MySQL and restart normally

### Solution 4: Quick Test Connection

Test if MySQL is accessible with your credentials:

```powershell
# Create a test PHP file
@"
<?php
\$host = 'localhost';
\$user = 'root';
\$pass = 'john@1991js';
\$db = 'cmd_ing_guwahati';

try {
    \$pdo = new PDO("mysql:host=\$host;dbname=\$db", \$user, \$pass);
    echo "Connection successful!";
} catch(PDOException \$e) {
    echo "Connection failed: " . \$e->getMessage();
}
"@ | Out-File -FilePath "test_mysql.php" -Encoding UTF8

# Run the test
php test_mysql.php
```

## Quick Fix Steps

1. **Check if MySQL is running:**
   - Open XAMPP Control Panel
   - Make sure MySQL shows green (running)

2. **Update phpMyAdmin config:**
   - Find `config.inc.php` in your phpMyAdmin folder
   - Update password to: `john@1991js`
   - Set `auth_type` to `'config'`

3. **Restart services:**
   - Stop and start MySQL in XAMPP
   - Clear browser cache
   - Try accessing phpMyAdmin again

## Still Not Working?

If none of the above works:
1. Check MySQL error logs
2. Verify MySQL is listening on port 3306
3. Check Windows Firewall isn't blocking MySQL
4. Try connecting via command line: `mysql -u root -p`

