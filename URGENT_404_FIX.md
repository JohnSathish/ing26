# URGENT: Fix 404 Error - Step by Step

## 🚨 The Problem

Site is showing WordPress 404 page instead of your React app.

## ✅ Immediate Fix

### Step 1: Verify Files on Server

**In cPanel File Manager:**

1. Navigate to `public_html/newsite/`
2. **Enable "Show Hidden Files"** (Settings → Show Hidden Files)
3. **Check these files exist:**
   - ✅ `index.html` (must exist!)
   - ✅ `.htaccess` (hidden file)
   - ✅ `assets/` folder
   - ✅ `api/` folder

### Step 2: Replace .htaccess File

**The `.htaccess` file I just created is simplified and should work.**

**In cPanel File Manager:**

1. Go to `public_html/newsite/`
2. **Delete the existing `.htaccess` file** (if it exists)
3. **Create a new file** named `.htaccess` (with the dot!)
4. **Copy and paste this EXACT content:**

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

5. **Save** the file
6. **Set permissions to 644**

### Step 3: Verify Parent .htaccess

**Check `public_html/.htaccess` (WordPress file):**

1. Open `public_html/.htaccess`
2. **Look for this at the TOP** (before any WordPress rules):

```apache
# Exclude /newsite/ from WordPress routing
RewriteCond %{REQUEST_URI} ^/newsite/
RewriteRule ^ - [L]
```

**If this is missing or in the wrong place:**
1. Find: `RewriteBase /`
2. Add the exclusion rule **IMMEDIATELY AFTER** it
3. Save

### Step 4: Test Direct File Access

**Try this URL:**
```
https://donboscoguwahati.org/newsite/index.html
```

- ✅ **If this works:** `.htaccess` routing issue
- ❌ **If this fails:** `index.html` not uploaded or wrong location

### Step 5: Clear Browser Cache

1. Press **Ctrl+Shift+Delete**
2. Clear **Cached images and files**
3. Try again: `https://donboscoguwahati.org/newsite/`

## 🔍 Troubleshooting

### Still Getting 404?

1. **Check Error Logs:**
   - cPanel → Metrics → Errors
   - Look for `.htaccess` syntax errors

2. **Test Minimal .htaccess:**
   Replace `.htaccess` with this MINIMAL version:

```apache
RewriteEngine On
DirectoryIndex index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]
```

If this works, then add API routing back.

3. **Verify File Permissions:**
   - `.htaccess`: **644**
   - `index.html`: **644**
   - `newsite` folder: **755**

4. **Check if mod_rewrite is enabled:**
   - Contact hosting support if unsure
   - Most cPanel hosts have it enabled by default

## 📋 Quick Checklist

- [ ] `.htaccess` exists in `public_html/newsite/`
- [ ] `index.html` exists in `public_html/newsite/`
- [ ] `.htaccess` has correct content (no `RewriteBase`)
- [ ] Parent `.htaccess` excludes `/newsite/`
- [ ] File permissions: 644 for files, 755 for folders
- [ ] Browser cache cleared
- [ ] Tested `index.html` directly

## 🎯 Most Likely Issue

**The `.htaccess` file has `RewriteBase /newsite/` which is causing problems!**

**Solution:** Use the simplified `.htaccess` I provided above (without `RewriteBase`).

---

**After updating `.htaccess`, your site should load!** 🚀

