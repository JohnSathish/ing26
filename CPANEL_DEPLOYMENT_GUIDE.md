# Complete cPanel Deployment Guide

This guide will walk you through deploying your React + PHP application to cPanel hosting.

## 📋 Prerequisites

- ✅ cPanel hosting account with PHP 8+ support
- ✅ MySQL database access
- ✅ FTP/cPanel File Manager access
- ✅ Node.js installed on your local machine (for building)
- ✅ Your domain name configured in cPanel

---

## 🚀 Step-by-Step Deployment

### **Step 1: Prepare Your Local Environment**

1. **Ensure all dependencies are installed:**
   ```bash
   cd frontend
   npm install
   ```

2. **Build the React application for production:**
   ```bash
   npm run build
   ```
   
   This will create optimized production files in the `public_html/` directory.

3. **Verify the build:**
   - Check that `public_html/index.html` exists
   - Check that `public_html/assets/` directory contains JS and CSS files

---

### **Step 2: Database Setup in cPanel**

1. **Log into cPanel** and navigate to **MySQL Databases**

2. **Create a new database:**
   - Enter database name (e.g., `yourdomain_cmd_ing`)
   - Click "Create Database"
   - Note the full database name (usually `guwahatidonbosco_cmd_ing`)

3. **Create a database user:**
   - Enter username (e.g., `guwahatidonbosco_cmd_user`)
   - Enter a strong password 8i(!Eh2_2+K6K}ex
   - Click "Create User"
   - **Save the username and password** - you'll need them!

4. **Add user to database:**
   - Select the user and database
   - Click "Add"
   - Grant **ALL PRIVILEGES**
   - Click "Make Changes"

5. **Import the database schema:**
   - Go to **phpMyAdmin** in cPanel
   - Select your database from the left sidebar
   - Click **Import** tab
   - Choose file: `database/schema.sql`
   - Click **Go**
   
   **Repeat for additional schema files:**
   - Import `database/schema_updates.sql`
   - Import `database/add_strenna_table.sql` (if needed)

6. **Create admin user:**
   - In phpMyAdmin, select your database
   - Click **SQL** tab
   - Run this query (replace with your secure password):
   
   ```sql
   -- First, generate a password hash using PHP:
   -- You can use: https://www.php.net/manual/en/function.password-hash.php
   -- Or use this online tool: https://bcrypt-generator.com/
   
   -- Example: Password "YourSecurePassword123!" becomes:
   INSERT INTO admins (username, password_hash, role, created_at) 
   VALUES (
     'admin', 
     '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJ5q5q5q5q', 
     'admin', 
     NOW()
   );
   ```
   
   **To generate password hash:**
   - Create a temporary PHP file on your server:
   ```php
   <?php
   echo password_hash('YourSecurePassword123!', PASSWORD_BCRYPT, ['cost' => 12]);
   ?>
   ```
   - Access it via browser to get the hash
   - Use that hash in the SQL query above

---

### **Step 3: Configure Database Credentials**

1. **Open** `public_html/api/config/database.php`

2. **Update the database credentials:**
   ```php
   define('DB_HOST', 'localhost'); // Usually 'localhost' in cPanel
   define('DB_NAME', 'your_cpanel_username_cmd_ing'); // Your full database name
   define('DB_USER', 'your_cpanel_username_cmd_user'); // Your database user
   define('DB_PASS', 'your_database_password'); // Your database password
   ```

3. **Set production environment:**
   - Open `public_html/api/config/constants.php`
   - Change:
   ```php
   define('ENVIRONMENT', 'production');
   ```

---

### **Step 4: Upload Files to cPanel**

**IMPORTANT:** Upload the **CONTENTS** of your local `public_html/` folder INTO the server's `public_html/` directory. Do NOT upload the `public_html` folder itself!

#### **Option A: Using cPanel File Manager (Recommended)**

1. **Log into cPanel** → **File Manager**

2. **Navigate to `public_html/` directory** (this already exists on your server)

3. **Upload files:**
   - Click **Upload** button
   - Select all files and folders from INSIDE your local `public_html/` directory:
     - `index.html` (file)
     - `assets/` folder (entire folder with all its contents)
     - `api/` folder (entire folder with all its contents)
     - `.htaccess` file (make sure "Show Hidden Files" is enabled)
   - Wait for upload to complete
   
   **Note:** You're uploading the contents INTO the existing `public_html/` on the server, not creating a new folder.

4. **Create uploads directory (if it doesn't exist):**
   - In File Manager, make sure you're inside `public_html/`
   - Click **+ Folder** button
   - Name it: `uploads`
   - Click **Create**
   - Open the `uploads/` folder
   - Click **+ Folder** again
   - Name it: `images`
   - Click **Create**
   - Go back to `public_html/`
   - Set permissions:
     - Right-click `uploads/` → **Change Permissions** → Set to **755**
     - Right-click `uploads/images/` → **Change Permissions** → Set to **755**

5. **Set file permissions:**
   - Files: **644**
   - Directories: **755**
   - `api/` directory: **755**
   - `uploads/` directory: **755**

#### **Option B: Using FTP Client (FileZilla, WinSCP, etc.)**

1. **Get FTP credentials from cPanel:**
   - Go to **FTP Accounts** in cPanel
   - Note your FTP host, username, and password

2. **Connect via FTP client:**
   - Host: `ftp.yourdomain.com` or your server IP
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21 (or 22 for SFTP)

3. **Navigate to `public_html/` directory** on the server (this is your web root)

4. **Upload all files and folders:**
   - Open your LOCAL `public_html/` folder on your computer
   - Select ALL files and folders INSIDE it (not the folder itself)
   - Drag and drop them INTO the server's `public_html/` directory
   - Ensure `.htaccess` is uploaded (it's a hidden file - enable "Show hidden files" in your FTP client)
   
   **Important:** You should see `index.html`, `assets/`, `api/`, and `.htaccess` directly inside the server's `public_html/`, not inside a nested `public_html/public_html/` folder.

5. **Set permissions** (same as above)

---

### **Step 5: Verify .htaccess File**

1. **Check that `.htaccess` is uploaded:**
   - In File Manager, enable "Show Hidden Files"
   - Verify `.htaccess` exists in `public_html/`

2. **Verify Apache mod_rewrite is enabled:**
   - Most cPanel hosts have this enabled by default
   - If React routes don't work, contact your host

---

### **Step 6: Test Your Deployment**

1. **Test the homepage:**
   - Visit: `https://yourdomain.com`
   - Verify the page loads correctly
   - Check browser console for errors (F12)

2. **Test API endpoints:**
   - Visit: `https://yourdomain.com/api/news/list`
   - Should return JSON data
   - If you see 404, check file permissions and `.htaccess`

3. **Test admin login:**
   - Visit: `https://yourdomain.com/login`
   - Login with your admin credentials
   - Verify dashboard loads

4. **Test file uploads:**
   - Go to Admin → News Management
   - Try uploading an image
   - Verify it appears correctly

---

### **Step 7: Security Checklist**

- [ ] Database credentials are updated
- [ ] `ENVIRONMENT` is set to `'production'`
- [ ] Admin password is changed from default
- [ ] File permissions are correct (644/755)
- [ ] `.htaccess` is in place
- [ ] HTTPS is working (check SSL certificate)
- [ ] `uploads/` directory is writable (755)
- [ ] Error display is OFF (check `constants.php`)

---

## 🔧 Troubleshooting Common Issues

### **Issue: React Routes Return 404**

**Solution:**
- Verify `.htaccess` is uploaded
- Check Apache mod_rewrite is enabled
- Verify `RewriteBase /` in `.htaccess`
- Contact your host if mod_rewrite is disabled

### **Issue: API Endpoints Return 404**

**Solution:**
- Check `public_html/api/index.php` exists
- Verify file permissions (644 for files, 755 for directories)
- Check `.htaccess` allows `/api/` access
- Verify database connection in `database.php`

### **Issue: Database Connection Error**

**Solution:**
- Double-check credentials in `database.php`
- Verify database user has proper permissions
- Check database name is correct (include cPanel username prefix)
- Verify database exists in phpMyAdmin

### **Issue: Images Not Uploading**

**Solution:**
- Check `uploads/` directory exists
- Verify permissions: `uploads/` = 755, `uploads/images/` = 755
- Check PHP upload limits in `.htaccess`
- Verify disk space on server

### **Issue: Session/Login Not Working**

**Solution:**
- Verify HTTPS is working (required for secure cookies)
- Check `security.php` session settings
- Verify PHP sessions directory is writable
- Check browser console for cookie errors

### **Issue: CORS Errors**

**Solution:**
- Verify API is on same domain (no CORS needed)
- Check `api/index.php` CORS settings
- Ensure frontend and API are on same domain

### **Issue: White Screen / Blank Page**

**Solution:**
- Check browser console for JavaScript errors
- Verify `index.html` exists in `public_html/`
- Check `assets/` folder is uploaded correctly
- Verify file permissions
- Check PHP error logs in cPanel

---

## 📁 File Structure on cPanel

Your `public_html/` should look like this:

```
public_html/
├── index.html          (React build output)
├── .htaccess           (Apache configuration)
├── assets/             (React JS/CSS files)
│   ├── index-xxxxx.js
│   ├── index-xxxxx.css
│   └── ...
├── api/                (PHP API)
│   ├── index.php
│   ├── config/
│   ├── middleware/
│   ├── auth/
│   ├── news/
│   ├── birthday/
│   └── ...
└── uploads/            (User uploaded files)
    └── images/
```

---

## 🔄 Updating Your Site

When you make changes:

1. **Update code locally**
2. **Build React app:** `cd frontend && npm run build`
3. **Upload only changed files** to cPanel
4. **Clear browser cache** or do hard refresh (Ctrl+Shift+R)

---

## 📞 Getting Help

If you encounter issues:

1. **Check cPanel Error Logs:**
   - cPanel → Metrics → Errors
   - Look for PHP errors

2. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for JavaScript errors

3. **Check Database:**
   - phpMyAdmin → Your database
   - Verify tables exist

4. **Contact Your Host:**
   - If mod_rewrite is disabled
   - If PHP version is too old
   - If file permissions can't be changed

---

## ✅ Post-Deployment Checklist

- [ ] Homepage loads correctly
- [ ] All sections display properly
- [ ] Admin login works
- [ ] Can create/edit/delete content
- [ ] Images upload successfully
- [ ] News articles display correctly
- [ ] All links work
- [ ] Mobile responsive design works
- [ ] HTTPS is enforced
- [ ] No console errors
- [ ] No PHP errors in logs

---

## 🎉 You're Done!

Your application should now be live! Visit your domain to see it in action.

**Important:** Remember to:
- Keep your admin password secure
- Regularly backup your database
- Monitor error logs
- Keep dependencies updated

---

## 📝 Quick Reference

**Database Config:** `public_html/api/config/database.php`
**Environment:** `public_html/api/config/constants.php`
**Main API Router:** `public_html/api/index.php`
**React Build:** `public_html/index.html` + `public_html/assets/`

**Admin Login:** `https://yourdomain.com/login`
**API Endpoint:** `https://yourdomain.com/api/`

---

Good luck with your deployment! 🚀

