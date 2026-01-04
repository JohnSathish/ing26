# Fix 404 Error for API Endpoints

## Quick Diagnosis

**Test this first:** Visit `https://donboscoguwahati.org/api/auth/check/api/news/list` directly in your browser.

- **If you see JSON:** API is working! The issue is in the frontend.
- **If you see 404:** API routing is broken (see solutions below)
- **If you see 500:** Database/configuration issue

---

## Solution 1: Fix .htaccess API Routing (Most Common Fix)

The main `.htaccess` file needs to route API requests BEFORE React routing.

### Update `public_html/.htaccess`

Make sure it has this order (API routing FIRST):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # API Routing - Route /api/* requests to /api/index.php
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ /api/index.php [QSA,L]
    
    # React Router - Serve index.html for all non-file requests
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{REQUEST_URI} !^/uploads/
    RewriteRule ^(.*)$ /index.html [L]
</IfModule>
```

**Important:** API routing must come BEFORE React routing!

---

## Solution 2: Verify api/.htaccess Exists

1. Check `public_html/api/.htaccess` exists
2. It should contain:

```apache
RewriteEngine On
RewriteBase /api/

# If the requested file doesn't exist, route to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

3. If missing, create it with the content above
4. Set permissions: **644**

---

## Solution 3: Check File Structure

Verify these files exist:

```
public_html/
├── .htaccess           ✅ Must exist
└── api/
    ├── .htaccess       ✅ Must exist
    ├── index.php       ✅ Must exist
    └── config/
        ├── database.php ✅ Must exist
        └── constants.php ✅ Must exist
```

---

## Solution 4: Test Direct API Access

1. **Test simple endpoint:**
   - Visit: `https://yourdomain.com/api/auth/check`
   - Should return: `{"success":true,"authenticated":false}` or similar JSON

2. **If you get 404:**
   - API routing is broken
   - Check `.htaccess` files
   - Check file permissions

3. **If you get 500:**
   - Database connection issue
   - Check `database.php` credentials
   - Check error logs

---

## Solution 5: Check File Permissions

In cPanel File Manager:

- `public_html/.htaccess`: **644**
- `public_html/api/.htaccess`: **644**
- `public_html/api/index.php`: **644**
- `public_html/api/` folder: **755**
- All subdirectories: **755**

---

## Solution 6: Check Error Logs

1. cPanel → **Metrics** → **Errors**
2. Look for:
   - "File not found" errors
   - "Permission denied" errors
   - PHP errors

---

## Solution 7: Test with Simple PHP File

Create `public_html/api/test.php`:

```php
<?php
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'API test works']);
?>
```

Visit: `https://yourdomain.com/api/test.php`

- **If it works:** PHP is fine, routing issue
- **If 404:** File permissions or path issue
- **If 500:** PHP configuration issue

---

## Most Likely Fix

**90% of the time, it's the `.htaccess` routing order.**

1. **Re-upload `public_html/.htaccess`** with API routing FIRST
2. **Verify `public_html/api/.htaccess`** exists
3. **Check file permissions** (644/755)
4. **Test:** `https://yourdomain.com/api/auth/check`

---

## Still Not Working?

**Tell me:**
1. What exact URL returns 404? (e.g., `/api/news/list`)
2. What do you see when visiting it directly in browser?
3. Any errors in cPanel Error Logs?
4. Does `https://yourdomain.com/api/test.php` work? (create test file above)

