# Fix Password Update Issue

The password column is protected in MariaDB. Here are solutions:

## Solution 1: Use SET PASSWORD (Recommended)

While still connected to MySQL in safe mode, try:

```sql
SET PASSWORD FOR 'root'@'localhost' = PASSWORD('john@1991js');
FLUSH PRIVILEGES;
EXIT;
```

## Solution 2: Connect Without Password and Use ALTER USER

1. **Stop safe mode** (Ctrl+C in the safe mode window)
2. **Start MySQL normally** from XAMPP Control Panel
3. **Try connecting without password:**
   ```cmd
   cd C:\xampp\mysql\bin
   .\mysql -u root
   ```
4. **If that works, run:**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'john@1991js';
   FLUSH PRIVILEGES;
   EXIT;
   ```

## Solution 3: Fix Checksum Error First

The checksum error suggests database corruption. Try repairing:

While connected in safe mode:
```sql
USE mysql;
REPAIR TABLE user;
```

Then try setting password again.

## Solution 4: Reset MariaDB Root Password (Complete Reset)

If nothing works, you can reset MariaDB completely:

1. **Stop MySQL** from XAMPP
2. **Backup your databases** (if any):
   ```cmd
   cd C:\xampp\mysql\bin
   .\mysqldump -u root --all-databases > C:\backup.sql
   ```
3. **Delete the mysql database files:**
   - Go to: `C:\xampp\mysql\data\mysql\`
   - **BACKUP FIRST!** Then delete all files in that folder
4. **Reinitialize MySQL:**
   ```cmd
   cd C:\xampp\mysql\bin
   .\mysql_install_db.exe --datadir=C:\xampp\mysql\data
   ```
5. **Start MySQL** - root will have no password
6. **Set password:**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'john@1991js';
   ```
7. **Restore databases** (if you backed them up)

## Quick Test: Try Connecting Without Password

The easiest test - just try:
```cmd
cd C:\xampp\mysql\bin
.\mysql -u root
```

If this works, then you can set the password using ALTER USER (Solution 2).

