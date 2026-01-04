# MariaDB Password Reset (XAMPP)

When MariaDB is running with `--skip-grant-tables`, you cannot use `ALTER USER`. You must directly update the `mysql.user` table.

## Steps:

### Step 1: Stop MySQL in XAMPP Control Panel

### Step 2: Start in Safe Mode
```powershell
cd C:\xampp\mysql\bin
.\mysqld --skip-grant-tables --console
```
Keep this window open!

### Step 3: Connect in New Window
Open NEW PowerShell:
```powershell
cd C:\xampp\mysql\bin
.\mysql -u root
```

### Step 4: Update Password Directly
Run these commands (one at a time or all together):

```sql
USE mysql;
UPDATE user SET password=PASSWORD('john@1991js') WHERE User='root';
FLUSH PRIVILEGES;
EXIT;
```

**For MariaDB 10.4+ (if above doesn't work):**
```sql
USE mysql;
UPDATE user SET authentication_string=PASSWORD('john@1991js') WHERE User='root' AND Host='localhost';
FLUSH PRIVILEGES;
EXIT;
```

**For MariaDB 10.4+ with new authentication (if still doesn't work):**
```sql
USE mysql;
UPDATE user SET plugin='mysql_native_password', authentication_string=PASSWORD('john@1991js') WHERE User='root' AND Host='localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 5: Stop Safe Mode
Press Ctrl+C in the safe mode window

### Step 6: Start MySQL Normally
From XAMPP Control Panel

### Step 7: Test
```powershell
.\mysql -u root -p
```
Enter: `john@1991js`

