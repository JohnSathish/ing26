# Troubleshooting 404 Error for /newsite/

## The Problem

Getting `404 (Not Found)` when accessing `https://donboscoguwahati.org/newsite/`

## 🔍 Diagnostic Steps

### Step 1: Verify Files Are Uploaded

**Check in cPanel File Manager:**

1. Navigate to `public_html/newsite/`
2. **Enable "Show Hidden Files"** (Settings → Show Hidden Files)
3. Verify these files exist:
   - ✅ `index.html`
   - ✅ `.htaccess` (hidden file)
   - ✅ `assets/` folder
   - ✅ `api/` folder

### Step 2: Test Direct File Access

Try accessing these URLs directly:

1. **index.html directly:**
   ```
   https://donboscoguwahati.org/newsite/index.html
   ```
   - ✅ **If this works:** `.htaccess` routing issue
   - ❌ **If this fails:** Files not uploaded correctly

2. **API endpoint:**
   ```
   https://donboscoguwahati.org/newsite/api/auth/check
   ```
   - ✅ **If this returns JSON:** API is working
   - ❌ **If this returns 404:** API routing issue

3. **Asset file:**
   ```
   https://donboscoguwahati.org/newsite/assets/index-*.js
   ```
   (Replace `*` with actual hash from `index.html`)
   - ✅ **If this loads:** Assets are accessible
   - ❌ **If this fails:** Asset path issue

### Step 3: Check .htaccess File

**In cPanel File Manager:**

1. Open `public_html/newsite/.htaccess`
2. Verify it contains:
   ```apache
   RewriteEngine On
   RewriteBase /newsite/
   ```
3. Check file permissions: **644**

### Step 4: Check Apache mod_rewrite

**Create a test file:** `public_html/newsite/test-rewrite.php`

```php
<?php
if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    if (in_array('mod_rewrite', $modules)) {
        echo "✅ mod_rewrite is enabled";
    } else {
        echo "❌ mod_rewrite is NOT enabled";
    }
} else {
    echo "⚠️ Cannot check modules (may still work)";
}
?>
```

Access: `https://donboscoguwahati.org/newsite/test-rewrite.php`

---

## 🔧 Common Fixes

### Fix 1: .htaccess Not Uploaded

**Problem:** `.htaccess` file is missing or not uploaded

**Solution:**
1. In cPanel File Manager, navigate to `public_html/newsite/`
2. Click **"New File"**
3. Name it: `.htaccess` (with the dot at the beginning)
4. Copy contents from `public_html/newsite/.htaccess` in your local project
5. Save

**Or upload via FTP:**
- Use FileZilla or similar
- Enable "Show hidden files"
- Upload `.htaccess` file

### Fix 2: Wrong RewriteBase

**Problem:** `RewriteBase` might be incorrect for your server setup

**Try this alternative .htaccess:**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    # Try without RewriteBase first
    # RewriteBase /newsite/

    # API Routing
    RewriteCond %{REQUEST_URI} ^/newsite/api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ /newsite/api/index.php [QSA,L]
    
    # React Router
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/newsite/api/
    RewriteCond %{REQUEST_URI} !^/newsite/uploads/
    RewriteCond %{REQUEST_URI} !\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|pdf)$
    RewriteRule ^(.*)$ /newsite/index.html [L]
</IfModule>
```

### Fix 3: Parent .htaccess Interference

**Problem:** The main `public_html/.htaccess` (for WordPress) might be interfering

**Check:** `public_html/.htaccess`

**Solution:** Add an exception for `/newsite/`:

```apache
# At the top of public_html/.htaccess, before WordPress rules
<IfModule mod_rewrite.c>
    RewriteEngine On
    # Don't process /newsite/ requests
    RewriteCond %{REQUEST_URI} ^/newsite/
    RewriteRule ^ - [L]
</IfModule>
```

### Fix 4: DirectoryIndex Issue

**Add to `.htaccess`:**

```apache
DirectoryIndex index.html index.php
```

This ensures `index.html` is served as the default file.

### Fix 5: File Permissions

**Set correct permissions:**
- Files: **644**
- Directories: **755**
- `.htaccess`: **644**

**In cPanel File Manager:**
1. Select file/folder
2. Click "Permissions"
3. Set: `644` for files, `755` for folders

---

## 🧪 Quick Test Script

**Create:** `public_html/newsite/test.php`

```php
<?php
echo "<h1>PHP is Working!</h1>";
echo "<p>Current directory: " . __DIR__ . "</p>";
echo "<p>Request URI: " . $_SERVER['REQUEST_URI'] . "</p>";
echo "<p>Script name: " . $_SERVER['SCRIPT_NAME'] . "</p>";
echo "<p>Document root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";

// Check if index.html exists
$indexPath = __DIR__ . '/index.html';
if (file_exists($indexPath)) {
    echo "<p>✅ index.html exists at: $indexPath</p>";
} else {
    echo "<p>❌ index.html NOT found at: $indexPath</p>";
}

// Check if .htaccess exists
$htaccessPath = __DIR__ . '/.htaccess';
if (file_exists($htaccessPath)) {
    echo "<p>✅ .htaccess exists at: $htaccessPath</p>";
    echo "<pre>" . file_get_contents($htaccessPath) . "</pre>";
} else {
    echo "<p>❌ .htaccess NOT found at: $htaccessPath</p>";
}
?>
```

Access: `https://donboscoguwahati.org/newsite/test.php`

This will show you:
- ✅ If PHP is working
- ✅ If files exist
- ✅ Current paths

---

## 📋 Checklist

- [ ] `.htaccess` file exists in `public_html/newsite/`
- [ ] `index.html` exists in `public_html/newsite/`
- [ ] `assets/` folder exists with JS/CSS files
- [ ] `api/` folder exists
- [ ] File permissions are correct (644/755)
- [ ] `mod_rewrite` is enabled (check with test-rewrite.php)
- [ ] Parent `.htaccess` doesn't interfere
- [ ] React app was built with `basename="/newsite"`

---

## 🎯 Most Likely Issues

1. **`.htaccess` not uploaded** (most common)
   - Solution: Upload manually via File Manager or FTP

2. **Parent `.htaccess` interfering**
   - Solution: Add exception for `/newsite/`

3. **Wrong file paths in `index.html`**
   - Solution: Rebuild React app with correct base path

4. **`mod_rewrite` not enabled**
   - Solution: Contact hosting support

---

## 🚀 Quick Fix Command (If You Have SSH Access)

```bash
cd public_html/newsite
ls -la  # Check if .htaccess exists
cat .htaccess  # View contents
```

If `.htaccess` is missing:
```bash
# Copy from backup or create new
nano .htaccess
# Paste contents, save (Ctrl+X, Y, Enter)
```

---

## 📞 Still Not Working?

1. **Check cPanel Error Logs:**
   - cPanel → Metrics → Errors
   - Look for specific error messages

2. **Check Apache Error Logs:**
   - cPanel → Metrics → Errors
   - Look for `.htaccess` syntax errors

3. **Contact Hosting Support:**
   - Ask if `mod_rewrite` is enabled
   - Ask if `.htaccess` files are allowed
   - Share the error logs

---

After following these steps, your site should work! 🎉

