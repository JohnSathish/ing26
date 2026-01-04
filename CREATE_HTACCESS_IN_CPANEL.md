# How to Create .htaccess File in cPanel

Since `.htaccess` is a hidden file (starts with a dot), it might not be visible or easy to create. Here's how to do it:

## Method 1: Using cPanel File Manager

### Step 1: Enable Show Hidden Files

1. Open **File Manager** in cPanel
2. Click **Settings** (gear icon) in the top right
3. Check **"Show Hidden Files (dotfiles)"**
4. Click **Save**

### Step 2: Create .htaccess File

1. Navigate to `public_html/newsite/` folder
2. Click **+ File** button
3. Name it: `.htaccess` (with the dot at the beginning)
4. Click **Create New File**
5. Double-click the file to edit it
6. Copy and paste the content from `public_html/newsite/.htaccess`
7. Click **Save Changes**
8. Set permissions: **644**

### Step 3: Create api/.htaccess

1. Navigate to `public_html/newsite/api/` folder
2. Click **+ File** button
3. Name it: `.htaccess`
4. Click **Create New File**
5. Double-click to edit
6. Copy content from `public_html/newsite/api/.htaccess`
7. Click **Save Changes**
8. Set permissions: **644**

---

## Method 2: Upload via FTP

1. **Download** the `.htaccess` files from your local project:
   - `public_html/newsite/.htaccess`
   - `public_html/newsite/api/.htaccess`

2. **Connect via FTP** (FileZilla, WinSCP, etc.)

3. **Enable "Show hidden files"** in your FTP client:
   - FileZilla: Server → Force showing hidden files
   - WinSCP: Options → Preferences → Panels → Show hidden files

4. **Upload** the files to:
   - `public_html/newsite/.htaccess`
   - `public_html/newsite/api/.htaccess`

---

## Method 3: Create via Terminal/SSH (if available)

If you have SSH access:

```bash
cd public_html/newsite
nano .htaccess
# Paste content, save (Ctrl+X, Y, Enter)

cd api
nano .htaccess
# Paste content, save
```

---

## Verify .htaccess Files Exist

After creating, verify:

1. In File Manager (with hidden files shown):
   - You should see `.htaccess` in `public_html/newsite/`
   - You should see `.htaccess` in `public_html/newsite/api/`

2. Test your site:
   - Visit: `https://donboscoguwahati.org/newsite/`
   - Should load your React app

---

## Quick Copy-Paste Content

### For `public_html/newsite/.htaccess`:

```apache
# CMD ING Guwahati - Security Hardened .htaccess
# Apache configuration for React SPA routing in /newsite/ subdirectory

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /newsite/

    # API Routing - Route /newsite/api/* requests to /newsite/api/index.php
    RewriteCond %{REQUEST_URI} ^/newsite/api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ api/index.php [QSA,L]
    
    # React Router - Serve index.html for all non-file requests
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/newsite/api/
    RewriteCond %{REQUEST_URI} !^/newsite/uploads/
    RewriteRule ^(.*)$ index.html [L]
</IfModule>

# Disable directory browsing
Options -Indexes
```

### For `public_html/newsite/api/.htaccess`:

```apache
# API .htaccess for /newsite/ subdirectory
RewriteEngine On
RewriteBase /newsite/api/

# If the requested file doesn't exist, route to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Deny direct access to config files
<FilesMatch "^(database|security|constants)\.php$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

## Troubleshooting

### Can't see .htaccess after creating?

1. Make sure "Show Hidden Files" is enabled
2. Refresh the File Manager
3. Check you're in the correct folder

### File won't save?

1. Check file permissions (should be 644)
2. Make sure you have write permissions
3. Try creating via FTP instead

---

**Remember:** `.htaccess` files are critical for routing. Without them, your React routes and API won't work!

