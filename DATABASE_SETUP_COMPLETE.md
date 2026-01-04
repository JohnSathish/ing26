# Complete Database Setup Guide

## Prerequisites
✅ MySQL is running  
✅ Root password is set: `john@1991js`  
✅ phpMyAdmin is configured  

## Step 1: Create the Database

Open MySQL command line:
```cmd
cd C:\xampp\mysql\bin
.\mysql -u root -p
```

Enter password: `john@1991js`

Then run:
```sql
CREATE DATABASE cmd_ing_guwahati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## Step 2: Import Main Schema

From your project directory:
```powershell
cd E:\Projects\ing26
C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati < database\schema.sql
```

When prompted, enter password: `john@1991js`

## Step 3: Import Schema Updates

```powershell
C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati < database\schema_updates.sql
```

Enter password: `john@1991js` again

## Step 4: Create Admin User

### 4a. Generate Password Hash

```powershell
php -r "echo password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);"
```

**Copy the entire hash** (it will look like: `$2y$12$...` - very long string)

### 4b. Insert Admin User

Connect to your database:
```cmd
cd C:\xampp\mysql\bin
.\mysql -u root -p cmd_ing_guwahati
```

Enter password: `john@1991js`

Then run (replace `YOUR_HASH_HERE` with the hash you copied):
```sql
INSERT INTO admins (username, password_hash, role) 
VALUES ('admin', 'YOUR_HASH_HERE', 'admin');
EXIT;
```

## Step 5: Verify Database Setup

Connect and check:
```cmd
.\mysql -u root -p cmd_ing_guwahati
```

Enter password: `john@1991js`

Check tables:
```sql
SHOW TABLES;
```

You should see tables like: `admins`, `news`, `birthday_wishes`, `circulars`, `newsline`, `gallery`, etc.

Check admin user:
```sql
SELECT id, username, role FROM admins;
```

You should see your admin user.

```sql
EXIT;
```

## Step 6: Test API Connection

Make sure your PHP server is running, then test:
```powershell
curl http://127.0.0.1:8000/api/newsline/current
```

You should get a JSON response like:
```json
{"success":true,"data":null}
```

(Even if data is null, that's fine - it means the connection works!)

## Step 7: Test Login

1. Open your browser: `http://localhost:5173` (or your Vite dev server URL)
2. Navigate to `/login`
3. Login with:
   - **Username:** `admin`
   - **Password:** `admin123`

## Troubleshooting

### "Unknown database 'cmd_ing_guwahati'"
- Make sure you completed Step 1 (CREATE DATABASE)

### "Table doesn't exist"
- Make sure you imported both schema.sql and schema_updates.sql

### "Access denied" when testing API
- Check that `database.php` has the correct password: `john@1991js`
- Make sure MySQL is running

### "Cannot login" in admin panel
- Make sure you created the admin user in Step 4
- Verify the password hash was copied correctly (it's very long!)

## Quick Commands Reference

```powershell
# Connect to database
cd C:\xampp\mysql\bin
.\mysql -u root -p cmd_ing_guwahati

# Import schema
cd E:\Projects\ing26
C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati < database\schema.sql

# Generate password hash
php -r "echo password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);"

# Test API
curl http://127.0.0.1:8000/api/newsline/current
```

