# Reset MySQL Database (Keep Your Data)

## Step-by-Step Reset

### Step 1: Stop MySQL
- Open **XAMPP Control Panel**
- Click **"Stop"** for MySQL service

### Step 2: Backup (Optional but Recommended)
If you have any databases you want to keep:
```powershell
cd C:\xampp\mysql\bin
.\mysqldump -u root -p --all-databases > C:\mysql_backup.sql
```
(You'll need the current password - if you don't know it, skip this)

### Step 3: Delete/Rename MySQL System Database

**Option A: Rename (Safer - keeps backup):**
```powershell
Rename-Item C:\xampp\mysql\data\mysql C:\xampp\mysql\data\mysql_backup
```

**Option B: Delete (Clean start):**
```powershell
Remove-Item C:\xampp\mysql\data\mysql -Recurse -Force
```

### Step 4: Reinitialize MySQL System Database
```cmd
cd C:\xampp\mysql\bin
.\mysql_install_db.exe --datadir=C:\xampp\mysql\data
```

### Step 5: Start MySQL
- Open **XAMPP Control Panel**
- Click **"Start"** for MySQL service

### Step 6: Connect (No Password)
```cmd
cd C:\xampp\mysql\bin
.\mysql -u root
```

You should connect successfully with **no password**!

### Step 7: Set Password
Once connected, run:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'john@1991js';
FLUSH PRIVILEGES;
EXIT;
```

### Step 8: Test Connection
```cmd
.\mysql -u root -p
```
Enter password: `john@1991js`

### Step 9: Create Your Database
```sql
CREATE DATABASE cmd_ing_guwahati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Step 10: Import Schema
```cmd
cd E:\Projects\ing26
.\mysql -u root -p cmd_ing_guwahati < database\schema.sql
.\mysql -u root -p cmd_ing_guwahati < database\schema_updates.sql
```
Enter password: `john@1991js`

### Step 11: Test API
```powershell
curl http://127.0.0.1:8000/api/newsline/current
```

You should now get a proper response!

