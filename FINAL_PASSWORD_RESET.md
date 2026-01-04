# Final Password Reset Solution

Since UPDATE commands aren't working, we need to use a different approach.

## Method 1: Use SET PASSWORD in Safe Mode

1. **Stop MySQL** in XAMPP Control Panel

2. **Start in safe mode:**
   ```cmd
   cd C:\xampp\mysql\bin
   .\mysqld --skip-grant-tables --console
   ```
   Keep this window open!

3. **Open NEW Command Prompt** and connect:
   ```cmd
   cd C:\xampp\mysql\bin
   .\mysql -u root
   ```

4. **Run SET PASSWORD:**
   ```sql
   SET PASSWORD FOR 'root'@'localhost' = PASSWORD('john@1991js');
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Stop safe mode** (Ctrl+C)

6. **Start MySQL normally** from XAMPP

7. **Test:**
   ```cmd
   .\mysql -u root -p
   ```
   Enter: `john@1991js`

## Method 2: Reset MariaDB Completely (If Method 1 Fails)

This will reset MySQL to default (no password):

1. **Stop MySQL** in XAMPP Control Panel

2. **Backup your databases** (if you have any):
   ```cmd
   cd C:\xampp\mysql\bin
   .\mysqldump -u root -p --all-databases > C:\mysql_backup.sql
   ```
   (You'll need the current password - if you don't know it, skip this)

3. **Delete mysql database files:**
   - Navigate to: `C:\xampp\mysql\data\mysql\`
   - **Delete all files** in that folder (or rename the folder to mysql_backup)

4. **Reinitialize MySQL:**
   ```cmd
   cd C:\xampp\mysql\bin
   .\mysql_install_db.exe --datadir=C:\xampp\mysql\data
   ```

5. **Start MySQL** from XAMPP - root will have **NO password**

6. **Connect and set password:**
   ```cmd
   .\mysql -u root
   ```
   Then:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'john@1991js';
   FLUSH PRIVILEGES;
   EXIT;
   ```

7. **Update database.php** - make sure it has:
   ```php
   define('DB_PASS', 'john@1991js');
   ```

## Method 3: Use XAMPP's Built-in Reset

XAMPP sometimes has a reset script. Check:
- `C:\xampp\reset_mysql_password.bat` (if it exists)

Or try XAMPP's shell:
1. Open XAMPP Control Panel
2. Click "Shell" button
3. Try: `mysql\bin\mysql.exe -u root`
4. If that works, set password from there

