# How to Reset MySQL Root Password

## Method 1: Reset Password via MySQL Command (If you can still access MySQL)

### Step 1: Stop MySQL Service

**If using XAMPP:**
1. Open XAMPP Control Panel
2. Click "Stop" for MySQL service

**If using Windows Service:**
```powershell
net stop MySQL
```

### Step 2: Start MySQL in Safe Mode (Skip Grant Tables)

**For XAMPP:**
1. Open Command Prompt as Administrator
2. Navigate to XAMPP MySQL bin directory:
   ```cmd
   cd C:\xampp\mysql\bin
   ```
3. Start MySQL in safe mode:
   ```cmd
   mysqld --skip-grant-tables --console
   ```
   Keep this window open!

**For Standalone MySQL:**
```cmd
cd C:\Program Files\MySQL\MySQL Server 8.0\bin
mysqld --skip-grant-tables --console
```

### Step 3: Open New Command Prompt Window

Open a **NEW** Command Prompt window (keep the safe mode one running) and connect:

```cmd
cd C:\xampp\mysql\bin
mysql -u root
```

### Step 4: Reset Password

Once connected, run these commands:

```sql
USE mysql;
UPDATE user SET authentication_string=PASSWORD('your_new_password') WHERE User='root';
FLUSH PRIVILEGES;
EXIT;
```

**For MySQL 8.0+ (if above doesn't work):**
```sql
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
FLUSH PRIVILEGES;
EXIT;
```

### Step 5: Restart MySQL Normally

1. Close the safe mode window (Ctrl+C)
2. Start MySQL normally from XAMPP Control Panel or:
   ```powershell
   net start MySQL
   ```

### Step 6: Test New Password

```cmd
mysql -u root -p
```
Enter your new password when prompted.

---

## Method 2: Reset to Empty Password (XAMPP Default)

If you want to remove the password entirely (XAMPP default):

### Step 1-3: Same as Method 1 (Start in safe mode)

### Step 4: Remove Password

```sql
USE mysql;
UPDATE user SET authentication_string='' WHERE User='root';
FLUSH PRIVILEGES;
EXIT;
```

**For MySQL 8.0+:**
```sql
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
EXIT;
```

### Step 5: Update database.php

Change back to:
```php
define('DB_PASS', ''); // Empty password
```

---

## Method 3: Using XAMPP MySQL Reset Script (Easiest)

1. Open XAMPP Control Panel
2. Click "Shell" button
3. Run:
   ```cmd
   mysql\bin\mysql.exe -u root
   ```
   If this works, you can reset password directly:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
   FLUSH PRIVILEGES;
   EXIT;
   ```

---

## Method 4: Complete MySQL Reinstall (Last Resort)

If nothing else works:

1. **Backup your databases** (if any):
   ```cmd
   mysqldump -u root -p --all-databases > backup.sql
   ```

2. **Uninstall MySQL** from XAMPP or Windows

3. **Reinstall** - This will reset everything to defaults

4. **Restore databases**:
   ```cmd
   mysql -u root < backup.sql
   ```

---

## Quick Fix: Set Password to Match Your Config

If you want to set the password to match what you have in `database.php` (`john@1991js`):

1. Follow Method 1 or 3
2. When resetting, use:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'john@1991js';
   FLUSH PRIVILEGES;
   ```

Then your `database.php` file will work correctly!

---

## Troubleshooting

### "Access Denied" when trying to connect
- Make sure MySQL is running in safe mode (skip-grant-tables)
- Try connecting without password: `mysql -u root` (no -p flag)

### "Can't connect to MySQL server"
- Make sure MySQL service is running
- Check if port 3306 is available
- Try: `netstat -ano | findstr :3306`

### "Unknown command" errors
- Make sure you're in the correct MySQL bin directory
- For XAMPP: `C:\xampp\mysql\bin`
- Use full path: `C:\xampp\mysql\bin\mysql.exe -u root`

