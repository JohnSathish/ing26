# Quick Deployment Steps Summary

## 1. Build React App
```bash
cd frontend
npm install
npm run build
```

## 2. Database Setup (cPanel)
1. Create database in cPanel → MySQL Databases
2. Create database user
3. Grant all privileges
4. Import via phpMyAdmin:
   - `database/schema.sql`
   - `database/schema_updates.sql`
   - `database/add_strenna_table.sql`

## 3. Create Admin User

**Option A: Via SQL (Recommended)**
```sql
-- Generate hash first using: https://bcrypt-generator.com/
-- Or create temp PHP file with: echo password_hash('YourPassword', PASSWORD_BCRYPT);
INSERT INTO admins (username, password_hash, role, created_at) 
VALUES ('admin', '$2y$12$YOUR_HASH_HERE', 'admin', NOW());
```

**Option B: Via PHP Script**
1. Upload `public_html/api/setup/create_admin.php`
2. Visit: `https://yourdomain.com/api/setup/create_admin.php?create_admin_token=YOUR_SECRET_TOKEN&username=admin&password=YourPassword`
3. **DELETE the file after use!**

## 4. Configure Files

**Update `public_html/api/config/database.php`:**
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_cpanel_username_dbname');
define('DB_USER', 'your_cpanel_username_dbuser');
define('DB_PASS', 'your_password');
```

**Update `public_html/api/config/constants.php`:**
```php
define('ENVIRONMENT', 'production');
```

## 5. Upload to cPanel

**Via File Manager:**
1. Upload to `public_html/`:
   - `index.html`
   - `assets/` folder
   - `api/` folder
   - `.htaccess` (show hidden files!)

2. Create directories:
   - `public_html/uploads/` (permissions: 755)
   - `public_html/uploads/images/` (permissions: 755)

3. Set permissions:
   - Files: 644
   - Directories: 755

## 6. Test

1. Visit: `https://yourdomain.com`
2. Test API: `https://yourdomain.com/api/news/list`
3. Login: `https://yourdomain.com/login`

## 7. Security

- [ ] Delete `create_admin.php` if used
- [ ] Verify HTTPS works
- [ ] Check file permissions
- [ ] Verify `.htaccess` is uploaded

---

**For detailed instructions, see:** `CPANEL_DEPLOYMENT_GUIDE.md`

