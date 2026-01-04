# Database Setup Guide

## Quick Setup for Local Development

### Step 1: Start MySQL

If using XAMPP:
1. Open XAMPP Control Panel
2. Start MySQL service

If using standalone MySQL:
- Make sure MySQL service is running

### Step 2: Create Database

Open MySQL command line or phpMyAdmin and run:

```sql
CREATE DATABASE cmd_ing_guwahati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Import Schema

```bash
# Using command line (adjust path to mysql.exe if needed)
mysql -u root -p cmd_ing_guwahati < database/schema.sql

# Or if using XAMPP:
C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati < database/schema.sql
```

Then import the additional schema updates:
```bash
mysql -u root -p cmd_ing_guwahati < database/schema_updates.sql
```

### Step 4: Configure Database Credentials

Edit `public_html/api/config/database.php`:

**For XAMPP (default - no password):**
```php
define('DB_USER', 'root');
define('DB_PASS', '');  // Empty password
```

**For MySQL with password:**
```php
define('DB_USER', 'root');
define('DB_PASS', 'your_mysql_password');
```

**For custom MySQL user:**
```php
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### Step 5: Create Admin User

Generate password hash:
```bash
php -r "echo password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);"
```

Then insert into database:
```sql
USE cmd_ing_guwahati;
INSERT INTO admins (username, password_hash, role) 
VALUES ('admin', '$2y$12$YOUR_GENERATED_HASH_HERE', 'admin');
```

### Step 6: Test Connection

Restart the PHP server and test:
```bash
curl http://127.0.0.1:8000/api/banners/list
```

You should get a JSON response (even if empty array).

## Troubleshooting

### "Access denied for user 'root'@'localhost'"
- **Solution**: Set the correct password in `database.php` or create a MySQL user without password
- **XAMPP**: Usually root has no password, but check XAMPP settings
- **Standalone MySQL**: You may need to set/reset root password

### "Unknown database 'cmd_ing_guwahati'"
- **Solution**: Create the database (Step 2) and import schema (Step 3)

### "Table doesn't exist"
- **Solution**: Import both `schema.sql` and `schema_updates.sql`

### MySQL not running
- **XAMPP**: Start MySQL from XAMPP Control Panel
- **Windows Service**: Check Services (services.msc) for MySQL service
- **Command**: `net start MySQL` (may require admin)

