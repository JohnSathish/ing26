# Quick Fix for 404 Error on /newsite/

## 🚨 Immediate Actions Required

### Step 1: Upload .htaccess File to Server

**The `.htaccess` file is missing on your server!**

1. **Go to cPanel → File Manager**
2. **Navigate to:** `public_html/newsite/`
3. **Enable "Show Hidden Files"** (Settings icon → Show Hidden Files)
4. **Create new file:** Click "New File"
5. **Name it:** `.htaccess` (with the dot!)
6. **Copy this content:**

```apache
# CMD ING Guwahati - React SPA .htaccess for /newsite/ subdirectory
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # API Routing - Route /newsite/api/* to api/index.php
    RewriteCond %{REQUEST_URI} ^/newsite/api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ api/index.php [QSA,L]
    
    # React Router - Serve index.html for all non-file requests
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/newsite/api/
    RewriteCond %{REQUEST_URI} !^/newsite/uploads/
    RewriteCond %{REQUEST_URI} !\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|pdf)$
    RewriteRule ^(.*)$ index.html [L]
</IfModule>

DirectoryIndex index.html
Options -Indexes
```

7. **Save the file**

### Step 2: Update Parent .htaccess (Important!)

**The WordPress `.htaccess` in `public_html/` might be interfering!**

1. **Go to:** `public_html/.htaccess`
2. **Find this line** (near the top):
   ```apache
   RewriteEngine On
   RewriteBase /
   ```
3. **Add this RIGHT AFTER `RewriteBase /`** (before WordPress rules):
   ```apache
   # Exclude /newsite/ from WordPress routing
   RewriteCond %{REQUEST_URI} ^/newsite/
   RewriteRule ^ - [L]
   ```

This tells WordPress to ignore `/newsite/` requests and let the subdirectory handle its own routing.

### Step 3: Verify Files Exist

**Check these files exist in `public_html/newsite/`:**

- ✅ `index.html`
- ✅ `.htaccess` (hidden file - enable "Show Hidden Files")
- ✅ `assets/` folder (with JS/CSS files)
- ✅ `api/` folder

### Step 4: Test

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Visit:** `https://donboscoguwahati.org/newsite/`
3. **Should see:** Your React app homepage

---

## 🔍 If Still Not Working

### Test 1: Direct File Access

Try: `https://donboscoguwahati.org/newsite/index.html`

- ✅ **If this works:** `.htaccess` routing issue
- ❌ **If this fails:** Files not uploaded correctly

### Test 2: Check File Permissions

In cPanel File Manager:
- Select `.htaccess` file
- Click "Permissions"
- Set to: **644**

### Test 3: Check Error Logs

1. **cPanel → Metrics → Errors**
2. Look for `.htaccess` syntax errors
3. Share any errors you find

---

## 📝 Alternative: Use FTP

If cPanel File Manager doesn't work:

1. **Use FileZilla or similar FTP client**
2. **Connect to your server**
3. **Navigate to:** `/public_html/newsite/`
4. **Upload:** `.htaccess` file
5. **Make sure it's named:** `.htaccess` (with dot)

---

## ✅ Summary

**The main issue:** `.htaccess` file is missing on the server!

**Quick fix:**
1. ✅ Create `.htaccess` in `public_html/newsite/`
2. ✅ Update parent `.htaccess` to exclude `/newsite/`
3. ✅ Verify file permissions (644)
4. ✅ Test the site

**After these steps, your site should work!** 🎉

