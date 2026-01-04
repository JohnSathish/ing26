# Troubleshooting 404 Errors in cPanel

## Quick Diagnosis

First, identify what's returning 404:
1. **API endpoints?** (e.g., `/api/news/list`)
2. **React routes?** (e.g., `/login`, `/admin`)
3. **Static assets?** (e.g., `/assets/index-xxx.js`)

---

## Common Causes & Solutions

### 1. API Endpoints Return 404

#### Check 1: Verify API Files Are Uploaded
- [ ] `public_html/api/index.php` exists
- [ ] `public_html/api/config/` folder exists
- [ ] All subdirectories are uploaded (`auth/`, `news/`, `birthday/`, etc.)

#### Check 2: Verify .htaccess File
- [ ] `.htaccess` exists in `public_html/`
- [ ] File permissions: **644**
- [ ] Content includes API routing rules

#### Check 3: Test Direct API Access
Visit in browser: `https://yourdomain.com/api/news/list`

**If you see:**
- **404 Not Found** → API routing issue
- **403 Forbidden** → File permissions issue
- **500 Error** → Database/configuration issue
- **JSON response** → API is working!

#### Solution A: Fix .htaccess for API Routing

Make sure your `.htaccess` has this rule:

```apache
# React Router - Serve index.html for all non-file requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/    # ← This excludes /api/ from React routing
RewriteCond %{REQUEST_URI} !^/uploads/
RewriteRule ^(.*)$ /index.html [L]
```

#### Solution B: Check API Router (index.php)

Verify `public_html/api/index.php` exists and has proper routing.

#### Solution C: Check File Permissions

In cPanel File Manager:
- Files: **644**
- Directories: **755**
- `api/` folder: **755**
- `api/index.php`: **644**

---

### 2. React Routes Return 404

#### Check: .htaccess Rewrite Rules

Your `.htaccess` should have:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # React Router - Serve index.html for all non-file requests
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{REQUEST_URI} !^/uploads/
    RewriteRule ^(.*)$ /index.html [L]
</IfModule>
```

#### Solution: Enable mod_rewrite

If React routes don't work:
1. Contact your hosting provider
2. Ask them to enable Apache `mod_rewrite`
3. Most cPanel hosts have this enabled by default

---

### 3. Static Assets Return 404

#### Check: Assets Folder
- [ ] `public_html/assets/` folder exists
- [ ] Contains `.js` and `.css` files
- [ ] File permissions: **644** for files, **755** for folder

#### Solution: Re-upload Assets

If assets are missing:
1. Rebuild: `cd frontend && npm run build`
2. Re-upload `assets/` folder to `public_html/`

---

## Step-by-Step Debugging

### Step 1: Check Browser Console

1. Open your site: `https://yourdomain.com`
2. Press **F12** → **Console** tab
3. Look for 404 errors
4. Note the exact URL that's failing

### Step 2: Test API Directly

1. Visit: `https://yourdomain.com/api/news/list`
2. **Expected:** JSON response
3. **If 404:** API routing issue
4. **If 500:** Database/configuration issue

### Step 3: Check File Structure

In cPanel File Manager, verify:

```
public_html/
├── index.html          ✅
├── .htaccess           ✅
├── assets/             ✅
│   └── (JS/CSS files)
└── api/                 ✅
    ├── index.php        ✅
    ├── config/          ✅
    └── ...
```

### Step 4: Check .htaccess Content

1. Open `.htaccess` in File Manager
2. Verify it contains the React routing rules
3. If missing, re-upload from your local copy

### Step 5: Check Error Logs

1. cPanel → **Metrics** → **Errors**
2. Look for PHP errors
3. Check for file permission errors

---

## Quick Fixes

### Fix 1: Re-upload .htaccess

1. Download `.htaccess` from your local `public_html/`
2. Upload to cPanel `public_html/`
3. Set permissions: **644**
4. Test again

### Fix 2: Verify API Router

1. Check `public_html/api/index.php` exists
2. Open it in File Manager
3. Verify it has routing code
4. If empty/corrupted, re-upload

### Fix 3: Check Base Path

If your site is in a subdirectory (e.g., `/subfolder/`):
- Update `RewriteBase /` to `RewriteBase /subfolder/`
- Update React build base path

### Fix 4: Test with Simple PHP File

Create `public_html/api/test.php`:
```php
<?php
echo json_encode(['success' => true, 'message' => 'API is working']);
?>
```

Visit: `https://yourdomain.com/api/test.php`

- **If it works:** API routing is fine, check `index.php`
- **If 404:** `.htaccess` or file permissions issue

---

## Common cPanel-Specific Issues

### Issue: Files Uploaded to Wrong Location

**Symptom:** Everything returns 404

**Check:**
- Files are in `public_html/`, not `public_html/public_html/`
- No nested folders

### Issue: Case Sensitivity

**Symptom:** Some files work, others don't

**Solution:**
- Linux servers are case-sensitive
- Ensure filenames match exactly (e.g., `index.php` not `Index.php`)

### Issue: PHP Version

**Symptom:** 500 errors or 404 for PHP files

**Solution:**
1. cPanel → **Select PHP Version**
2. Choose **PHP 8.0+**
3. Save

---

## Still Not Working?

### Debug Checklist:

1. **What exact URL returns 404?**
   - `/api/news/list` → API issue
   - `/login` → React routing issue
   - `/assets/index.js` → Assets issue

2. **What do you see when visiting the URL directly?**
   - 404 Not Found → Routing/permissions
   - 403 Forbidden → Permissions
   - 500 Error → PHP/configuration
   - Blank page → PHP error (check logs)

3. **Check cPanel Error Logs:**
   - cPanel → Metrics → Errors
   - Look for specific error messages

4. **Test API with simple endpoint:**
   - Create `public_html/api/test.php` (see above)
   - Visit: `https://yourdomain.com/api/test.php`
   - If this works, the issue is in `index.php` routing

---

## Most Likely Solutions

Based on your error, try these in order:

1. **Re-upload `.htaccess`** (most common fix)
2. **Check file permissions** (644/755)
3. **Verify `api/index.php` exists and is not empty**
4. **Test direct API access** (`/api/news/list`)
5. **Check error logs** in cPanel

---

## Need More Help?

Provide:
1. The exact URL returning 404
2. What you see when visiting it directly
3. Any errors from cPanel Error Logs
4. Screenshot of your `public_html/` file structure

