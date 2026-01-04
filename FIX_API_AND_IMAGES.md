# Fix API 404 and Image Path Issues

## Issues Found

1. **API requests returning 404** - All `/newsite/api/...` requests are getting WordPress 404 pages
2. **Images 404** - Images are requested from root (`/logoing.jpg`) instead of `/newsite/logoing.jpg`

## ✅ Fixes Applied

### 1. Fixed Image Paths

**Updated files:**
- `frontend/src/components/Header/Header.tsx` - Logo image path
- `frontend/src/components/RectorMajor/RectorMajor.tsx` - Rector Major images

**Changed:**
- `/logoing.jpg` → `/newsite/logoing.jpg`
- `/rector-major-council.jpg` → `/newsite/rector-major-council.jpg`
- `/rector-major-photo.jpg` → `/newsite/rector-major-photo.jpg`

### 2. Fixed API Routing

**Updated:**
- `public_html/newsite/.htaccess` - Improved API routing rule
- `public_html/newsite/api/.htaccess` - Removed problematic `RewriteBase`

## 🚀 Next Steps

### Step 1: Rebuild React App

```bash
cd frontend
npm run build
```

This will:
- Update image paths in the built JavaScript
- Include all the latest changes

### Step 2: Upload Files to Server

Upload to `public_html/newsite/`:
- `index.html` (updated)
- `assets/` folder (new JS with correct image paths)
- `.htaccess` file (updated API routing)
- `api/.htaccess` file (updated)

### Step 3: Verify API Folder Structure

**On server, check:**
- `public_html/newsite/api/` folder exists
- `public_html/newsite/api/index.php` exists
- `public_html/newsite/api/.htaccess` exists

### Step 4: Test

**After uploading, test:**

1. **API endpoint:**
   ```
   https://donboscoguwahati.org/newsite/api/auth/check
   ```
   Should return JSON: `{"authenticated": false}` (not WordPress 404)

2. **Images:**
   ```
   https://donboscoguwahati.org/newsite/logoing.jpg
   https://donboscoguwahati.org/newsite/rector-major-council.jpg
   https://donboscoguwahati.org/newsite/rector-major-photo.jpg
   ```
   Should load images (not 404)

3. **Homepage:**
   ```
   https://donboscoguwahati.org/newsite/
   ```
   Should load with images and API data

## 🔍 Troubleshooting

### API Still Returning 404?

1. **Check API folder exists:**
   - `public_html/newsite/api/` should exist
   - `public_html/newsite/api/index.php` should exist

2. **Check `.htaccess` files:**
   - `public_html/newsite/.htaccess` should have API routing rules
   - `public_html/newsite/api/.htaccess` should route to `index.php`

3. **Test API directly:**
   - Try: `https://donboscoguwahati.org/newsite/api/index.php`
   - Should return JSON or error, not WordPress 404

4. **Check error logs:**
   - cPanel → Metrics → Errors
   - Look for `.htaccess` syntax errors

### Images Still 404?

1. **Verify images exist:**
   - Check `public_html/newsite/logoing.jpg` exists
   - Check `public_html/newsite/rector-major-council.jpg` exists
   - Check `public_html/newsite/rector-major-photo.jpg` exists

2. **Check file permissions:**
   - Images should be **644**

3. **Test direct access:**
   - `https://donboscoguwahati.org/newsite/logoing.jpg`
   - Should load the image

## ✅ Summary

- ✅ Image paths updated to `/newsite/...`
- ✅ API routing improved in `.htaccess`
- ✅ API `.htaccess` simplified
- ⏳ **Rebuild required** - Run `npm run build`
- ⏳ **Upload required** - Upload new files to server

After rebuilding and uploading, both API and images should work! 🎉

