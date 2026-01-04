# Database Setup - Next Steps

## ✅ Step 1: Create Database

While connected to MySQL, run:

```sql
CREATE DATABASE cmd_ing_guwahati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## ✅ Step 2: Import Schema Files

Exit MySQL (type `EXIT;`), then from your project directory:

```powershell
cd E:\Projects\ing26
C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati < database\schema.sql
```

When prompted, enter password: `john@1991js`

Then import the updates:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati < database\schema_updates.sql
```

Enter password: `john@1991js`

## ✅ Step 3: Create Admin User

### Generate Password Hash

```powershell
php -r "echo password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);"
```

Copy the generated hash (starts with `$2y$12$...`)

### Insert Admin User

Connect to MySQL:
```cmd
cd C:\xampp\mysql\bin
.\mysql -u root -p cmd_ing_guwahati
```

Enter password: `john@1991js`

Then run (replace `YOUR_HASH_HERE` with the hash you generated):

```sql
INSERT INTO admins (username, password_hash, role) 
VALUES ('admin', 'YOUR_HASH_HERE', 'admin');
EXIT;
```

## ✅ Step 4: Test API Connection

```powershell
curl http://127.0.0.1:8000/api/newsline/current
```

You should get a JSON response! (Even if it's empty data, that's fine - it means the connection works)

## ✅ Step 5: Test Login

1. Open your browser: `http://localhost:5173` (or whatever port Vite is using)
2. Go to `/login`
3. Login with:
   - Username: `admin`
   - Password: `admin123`

## All Done! 🎉

Your database is now set up and ready to use!

