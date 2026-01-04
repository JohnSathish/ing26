# Critical 404 Fix - Step by Step

## 🚨 The Problem

Still getting `404 (Not Found)` for `https://donboscoguwahati.org/newsite/`

This means either:
1. `.htaccess` file is not on the server
2. `index.html` file is not in the right location
3. Parent `.htaccess` (WordPress) is still interfering
4. File permissions are wrong

## ✅ Step-by-Step Fix

### Step 1: Verify Files Exist on Server

**In cPanel File Manager:**

1. Navigate to `public_html/newsite/`
2. **Enable "Show Hidden Files"** (Settings → Show Hidden Files)
3. **Check these files exist:**
   - ✅ `index.html` (should be visible)
   - ✅ `.htaccess` (hidden file - should appear after enabling hidden files)
   - ✅ `assets/` folder
   - ✅ `api/` folder

**If `.htaccess` is missing:**
- Continue to Step 2

**If `index.html` is missing:**
- You need to rebuild and upload the React app

### Step 2: Create/Upload .htaccess File

**Option A: Create in cPanel File Manager**

1. In `public_html/newsite/`, click **"New File"**
2. Name it: `.htaccess` (with the dot!)
3. Open the file and paste this **EXACT** content:

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

4. **Save** the file
5. **Set permissions:** Right-click → Permissions → Set to **644**

**Option B: Upload via FTP**

1. Use FileZilla or similar
2. Connect to your server
3. Navigate to `/public_html/newsite/`
4. Upload `.htaccess` file from your local `public_html/newsite/.htaccess`
5. Make sure it's named `.htaccess` (with dot)

### Step 3: Verify Parent .htaccess

**Check `public_html/.htaccess` (WordPress file):**

1. Open `public_html/.htaccess` in cPanel
2. **Look for this at the TOP** (before WordPress rules):

```apache
# Exclude /newsite/ from WordPress routing
RewriteCond %{REQUEST_URI} ^/newsite/
RewriteRule ^ - [L]
```

**If this is missing:**
1. Find the line: `RewriteBase /`
2. Add the exclusion rule **RIGHT AFTER** it (before any WordPress rules)
3. Save

### Step 4: Test Direct File Access

**Try these URLs in your browser:**

1. **index.html directly:**
   ```
   https://donboscoguwahati.org/newsite/index.html
   ```
   - ✅ **If this works:** `.htaccess` routing issue
   - ❌ **If this fails:** File not uploaded or wrong location

2. **Check if .htaccess is being read:**
   Create a test file: `public_html/newsite/test.txt`
   - Content: `Hello World`
   - Access: `https://donboscoguwahati.org/newsite/test.txt`
   - ✅ **If this works:** Files are accessible
   - ❌ **If this fails:** Wrong directory or permissions

### Step 5: Check File Permissions

**In cPanel File Manager:**

1. Select `index.html`
2. Click "Permissions"
3. Should be: **644**

4. Select `.htaccess`
5. Click "Permissions"
6. Should be: **644**

7. Select `newsite` folder
8. Click "Permissions"
9. Should be: **755**

### Step 6: Check Error Logs

**In cPanel:**

1. Go to **Metrics → Errors**
2. Look for errors related to:
   - `.htaccess` syntax errors
   - File not found errors
   - Permission denied errors

**Common errors:**
- `.htaccess: RewriteEngine: bad flag 'RewriteEngine'` → Syntax error
- `File does not exist: /home/username/public_html/newsite/index.html` → Wrong path
- `Permission denied` → Wrong file permissions

## 🔧 Alternative: Minimal .htaccess Test

**If nothing works, try this MINIMAL `.htaccess` first:**

```apache
RewriteEngine On
DirectoryIndex index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]
```

This is the absolute minimum. If this works, then add the API routing rules back.

## 📋 Checklist

- [ ] `.htaccess` exists in `public_html/newsite/`
- [ ] `index.html` exists in `public_html/newsite/`
- [ ] `assets/` folder exists with JS/CSS files
- [ ] `api/` folder exists
- [ ] File permissions: 644 for files, 755 for folders
- [ ] Parent `.htaccess` excludes `/newsite/`
- [ ] `index.html` loads when accessed directly
- [ ] No `.htaccess` syntax errors in error logs

## 🎯 Most Common Issues

1. **`.htaccess` not uploaded** (90% of cases)
   - Solution: Upload manually via File Manager or FTP

2. **Wrong file location**
   - Should be: `public_html/newsite/.htaccess`
   - NOT: `public_html/.htaccess`

3. **Parent `.htaccess` interfering**
   - Solution: Add exclusion rule at top of `public_html/.htaccess`

4. **File permissions**
   - Solution: Set `.htaccess` to 644, folders to 755

## 🚀 Quick Test

**After uploading `.htaccess`, test immediately:**

1. Clear browser cache (Ctrl+Shift+Delete)
2. Visit: `https://donboscoguwahati.org/newsite/`
3. Should see your React app

**If still 404:**
- Check error logs
- Verify file locations
- Test `index.html` directly

---

**The `.htaccess` file MUST be on the server for this to work!** Make sure it's uploaded! 🎯

