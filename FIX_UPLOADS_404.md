# Fix Uploads 404 Error

## The Problem

Images in `/uploads/images/` are returning 404 errors. This is because:
1. The uploads folder might not exist on the server
2. WordPress `.htaccess` might be blocking access
3. Images might not be uploaded to the server

## ✅ Solution Applied

### 1. Updated Parent .htaccess

Added explicit exclusion for `/uploads/` in `public_html/.htaccess`:

```apache
# Exclude /uploads/ from WordPress routing - allow direct file access
RewriteCond %{REQUEST_URI} ^/uploads/
RewriteRule ^ - [L]
```

This ensures WordPress doesn't intercept upload requests.

## 🚀 Action Required

### Step 1: Verify Uploads Folder Exists

**In cPanel File Manager:**

1. Navigate to `public_html/`
2. **Check if `uploads/` folder exists**
3. **Check if `uploads/images/` folder exists**

**If missing, create them:**
- Create `uploads` folder
- Create `uploads/images` folder
- Set permissions: **755** for folders

### Step 2: Upload Images to Server

**The images need to be on the server!**

**Option A: Upload via Admin Panel**
1. Log into admin: `https://donboscoguwahati.org/newsite/login`
2. Go to Settings Management
3. Upload the province image
4. Upload other images via their respective management pages

**Option B: Upload via FTP/File Manager**
1. Upload images directly to `public_html/uploads/images/`
2. Make sure filenames match what's in the database

### Step 3: Update Parent .htaccess on Server

**Update `public_html/.htaccess` on the server:**

Add this rule **at the top** (after `RewriteBase /`):

```apache
# Exclude /uploads/ from WordPress routing - allow direct file access
RewriteCond %{REQUEST_URI} ^/uploads/
RewriteRule ^ - [L]
```

This ensures WordPress doesn't intercept upload requests.

### Step 4: Test Image Access

**Try accessing an image directly:**
```
https://donboscoguwahati.org/uploads/images/provincial-house.jpg
```

- ✅ **If this works:** Images are accessible
- ❌ **If this fails:** Images don't exist or wrong path

## 📋 Checklist

- [ ] `public_html/uploads/` folder exists
- [ ] `public_html/uploads/images/` folder exists
- [ ] Images are uploaded to `public_html/uploads/images/`
- [ ] Parent `.htaccess` excludes `/uploads/`
- [ ] Folder permissions: **755**
- [ ] File permissions: **644**

## 🔍 Troubleshooting

### Images Still 404?

1. **Check if images exist:**
   - In cPanel File Manager, navigate to `public_html/uploads/images/`
   - Verify the image files exist

2. **Check file permissions:**
   - Images should be **644**
   - Folders should be **755**

3. **Check database:**
   - Verify image paths in database match actual filenames
   - Check if paths include `/uploads/images/` prefix

4. **Test direct access:**
   - Try: `https://donboscoguwahati.org/uploads/images/[filename]`
   - Should load the image directly

## ✅ Summary

- ✅ Parent `.htaccess` updated to exclude `/uploads/`
- ⏳ **Action needed:** Verify uploads folder exists on server
- ⏳ **Action needed:** Upload images to server
- ⏳ **Action needed:** Update parent `.htaccess` on server

**The uploads folder must exist and contain the images for them to load!** 🎯

