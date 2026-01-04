# Initialize MySQL in Temp Directory

Since the data directory has other databases, we'll initialize in a temp folder and copy just the mysql folder.

## Step 1: Start MySQL and Test Connection

1. **Start MySQL** from XAMPP Control Panel
2. **Try connecting:**
   ```cmd
   cd C:\xampp\mysql\bin
   .\mysql -u root
   ```

If this works (no password needed), skip to Step 4!

## Step 2: Initialize in Temp Directory (If Step 1 Failed)

If connection failed, initialize MySQL in a temporary empty directory:

```cmd
cd C:\xampp\mysql\bin
mkdir C:\temp_mysql_init
.\mysql_install_db.exe --datadir=C:\temp_mysql_init
```

## Step 3: Copy MySQL Database Folder

After initialization completes:

```powershell
Copy-Item C:\temp_mysql_init\mysql C:\xampp\mysql\data\mysql -Recurse
Remove-Item C:\temp_mysql_init -Recurse -Force
```

## Step 4: Restart MySQL

1. **Stop MySQL** in XAMPP Control Panel
2. **Start MySQL** again
3. **Connect:**
   ```cmd
   cd C:\xampp\mysql\bin
   .\mysql -u root
   ```

## Step 5: Set Password

Once connected:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'john@1991js';
FLUSH PRIVILEGES;
EXIT;
```

## Step 6: Test

```cmd
.\mysql -u root -p
```
Enter: `john@1991js`

## Step 7: Create Your Database

```sql
CREATE DATABASE cmd_ing_guwahati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## Step 8: Import Schema

```cmd
cd E:\Projects\ing26
.\mysql -u root -p cmd_ing_guwahati < database\schema.sql
.\mysql -u root -p cmd_ing_guwahati < database\schema_updates.sql
```

Enter password: `john@1991js` when prompted.

