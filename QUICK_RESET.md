# Quick MySQL Password Reset Guide

## Easiest Method (Recommended)

### Option 1: Use the PowerShell Script

1. **Open PowerShell as Administrator** (Right-click PowerShell → Run as Administrator)

2. **Navigate to project directory:**
   ```powershell
   cd E:\Projects\ing26
   ```

3. **Run the reset script:**
   ```powershell
   .\reset-mysql-password.ps1
   ```

4. **Follow the prompts** - The script will guide you through the process

---

### Option 2: Manual Reset (Step-by-Step)

#### Step 1: Stop MySQL
- Open **XAMPP Control Panel**
- Click **"Stop"** for MySQL service

#### Step 2: Start MySQL in Safe Mode
Open **Command Prompt as Administrator** and run:

```cmd
cd C:\xampp\mysql\bin
mysqld --skip-grant-tables --console
```

**Keep this window open!** Don't close it.

#### Step 3: Open New Command Prompt
Open a **NEW** Command Prompt window (keep the safe mode one running):

```cmd
cd C:\xampp\mysql\bin
mysql -u root
```

#### Step 4: Reset Password
Once connected, run these commands:

**To set password to match your database.php (`john@1991js`):**
```sql
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'john@1991js';
FLUSH PRIVILEGES;
EXIT;
```

**OR to remove password (empty):**
```sql
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 5: Close Safe Mode
- Go back to the safe mode window
- Press **Ctrl+C** to stop it

#### Step 6: Start MySQL Normally
- Open **XAMPP Control Panel**
- Click **"Start"** for MySQL service

#### Step 7: Test Connection
```cmd
mysql -u root -p
```
Enter your password when prompted.

#### Step 8: Update database.php (if needed)
If you changed the password, make sure `public_html/api/config/database.php` matches:
```php
define('DB_PASS', 'your_password_here');
```

---

## After Resetting

1. **Restart your PHP server** (if it's running)
2. **Test the API:**
   ```powershell
   curl http://127.0.0.1:8000/api/newsline/current
   ```

You should now get a proper response instead of database connection errors!

