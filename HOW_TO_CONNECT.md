# How to Connect to MySQL/MariaDB

## Method 1: Connect via Command Line

### Step 1: Navigate to MySQL bin directory
```powershell
cd C:\xampp\mysql\bin
```

### Step 2: Connect to MySQL

**If you have a password:**
```powershell
.\mysql -u root -p
```
Then enter your password when prompted: `john@1991js`

**If no password (empty):**
```powershell
.\mysql -u root
```

### Step 3: Test Connection
Once connected, you should see:
```
MariaDB [(none)]>
```

Try running a simple command:
```sql
SHOW DATABASES;
```

## Method 2: Connect via XAMPP phpMyAdmin

1. **Start MySQL** from XAMPP Control Panel
2. **Click "Admin"** button next to MySQL (opens phpMyAdmin)
3. **Login:**
   - Username: `root`
   - Password: `john@1991js` (or leave empty if no password)
4. Click "Go"

## Method 3: Test Connection from Your Application

### Test PHP Connection
Create a test file `test-db.php` in `public_html/api/`:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'cmd_ing_guwahati');
define('DB_USER', 'root');
define('DB_PASS', 'john@1991js');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    echo "Connection successful! ✅";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>
```

Then visit: `http://localhost:8000/test-db.php`

### Test API Connection
```powershell
curl http://127.0.0.1:8000/api/newsline/current
```

If you get a JSON response (even with an error about missing data), the connection is working!

## Troubleshooting

### "Access denied for user 'root'@'localhost'"
- Password is incorrect
- Try connecting without password: `.\mysql -u root`
- If that works, the password hasn't been set yet

### "Can't connect to MySQL server"
- MySQL service is not running
- Start it from XAMPP Control Panel
- Check if port 3306 is in use: `netstat -ano | findstr :3306`

### "Unknown database 'cmd_ing_guwahati'"
- Database doesn't exist yet
- Create it: `CREATE DATABASE cmd_ing_guwahati;`

