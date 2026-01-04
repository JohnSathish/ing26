# Quick Start - Run Project Locally

## 🚀 Fastest Way: Frontend Only (No Database Needed)

This lets you see the UI immediately, but API calls will show errors.

### Step 1: Start React Dev Server

```powershell
cd frontend
npm run dev
```

**Open browser:** `http://localhost:5173`

You'll see the homepage, but API calls will fail (that's OK for UI testing).

---

## 🎯 Full Setup: Frontend + Backend (Recommended)

### Option A: Using XAMPP (Easiest for Windows)

#### Step 1: Install XAMPP
1. Download: https://www.apachefriends.org/
2. Install to `C:\xampp`
3. Open XAMPP Control Panel
4. Start **Apache** and **MySQL**

#### Step 2: Create Database
1. Open: `http://localhost/phpmyadmin`
2. Click "New" → Database name: `cmd_ing_guwahati` → Create
3. Click "Import" → Select `database/schema.sql` → Go

#### Step 3: Create Admin User
1. In phpMyAdmin, click "SQL" tab
2. Run this (generate hash first - see below):

```sql
-- Generate hash using PowerShell:
-- php -r "echo password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);"

INSERT INTO admins (username, password_hash, role) 
VALUES ('admin', 'PASTE_GENERATED_HASH_HERE', 'admin');
```

**Generate hash:**
```powershell
php -r "echo password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);"
```

#### Step 4: Copy Files to XAMPP
```powershell
Copy-Item -Path "public_html\*" -Destination "C:\xampp\htdocs\" -Recurse -Force
```

#### Step 5: Update Database Config
Edit `C:\xampp\htdocs\api\config\database.php`:
```php
define('DB_USER', 'root');
define('DB_PASS', ''); // XAMPP default is empty
```

#### Step 6: Start React Dev Server
```powershell
cd frontend
npm run dev
```

#### Step 7: Access Application
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost/api/`
- **Login:** Use `admin` / `admin123`

---

### Option B: Using PHP Built-in Server (No XAMPP)

#### Step 1: Set Up Database
You need MySQL running. Options:
- Install XAMPP (includes MySQL)
- Install MySQL separately
- Use online MySQL (like db4free.net)

#### Step 2: Create Database & Import Schema
```powershell
# If MySQL is in PATH:
mysql -u root -p -e "CREATE DATABASE cmd_ing_guwahati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p cmd_ing_guwahati < database\schema.sql

# Or use phpMyAdmin if you have XAMPP/WAMP
```

#### Step 3: Update Database Config
Edit `public_html/api/config/database.php`:
```php
define('DB_USER', 'root'); // Your MySQL username
define('DB_PASS', 'your_password'); // Your MySQL password
```

#### Step 4: Start PHP Server (Terminal 1)
```powershell
cd public_html
php -S localhost:8000
```

#### Step 5: Start React Dev Server (Terminal 2)
```powershell
cd frontend
npm run dev
```

#### Step 6: Access Application
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000/api/`

---

## ✅ Quick Test Commands

### Test PHP Server:
```powershell
cd public_html
php -S localhost:8000
# Then visit: http://localhost:8000/api/auth/check
# Should return: {"authenticated":false}
```

### Test React:
```powershell
cd frontend
npm run dev
# Then visit: http://localhost:5173
```

### Test Database Connection:
```powershell
php test-api.php
```

---

## 🔧 Troubleshooting

### "Database connection failed"
- Check MySQL is running (XAMPP Control Panel)
- Verify credentials in `database.php`
- Test connection: `mysql -u root -p`

### "Port 8000 already in use"
- Change port: `php -S localhost:8001`
- Update Vite proxy in `frontend/vite.config.ts`

### CORS Errors
- Make sure `ENVIRONMENT` is `'development'` in `constants.php`
- Check browser console for specific error

### "Cannot find module" errors
- Run: `cd frontend && npm install`

---

## 📝 Current Configuration

✅ **Environment:** Set to `development` in `constants.php`
✅ **Database Config:** Updated for localhost/root
✅ **Vite Proxy:** Configured to proxy `/api` to `localhost:8000`
✅ **CORS:** Enabled for localhost in development mode

---

## 🎯 Recommended: Start Here

1. **Quick UI Test (No Database):**
   ```powershell
   cd frontend
   npm run dev
   ```
   Visit: `http://localhost:5173`

2. **Full Setup (With Database):**
   - Install XAMPP
   - Follow "Option A" steps above
   - You'll have everything working!

