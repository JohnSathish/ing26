# Fix Frontend Loading Issues

## Problems
- Hero slider not loading
- FlashNews not loading
- News not loading
- Collaborations not loading
- Admin login not working

## Quick Diagnosis

### Step 1: Check if API Server is Running

```powershell
# Check if port 8000 is in use
netstat -an | findstr ":8000"
```

**If NOT running, start it:**
```powershell
cd E:\Projects\ing26\public_html
php -S localhost:8000 api/router.php
```

**Keep this terminal window open!**

### Step 2: Test API Endpoints

```powershell
cd E:\Projects\ing26
php test_api_endpoints.php
```

This will test all endpoints and show what's working.

### Step 3: Check Browser Console

1. Open your site in browser: `http://localhost:5173`
2. Press F12 to open Developer Tools
3. Go to "Console" tab
4. Look for red error messages
5. Go to "Network" tab
6. Refresh the page
7. Look for failed requests (red status codes)

### Step 4: Check Vite Proxy Configuration

The frontend uses Vite proxy to forward `/api/*` requests to `http://localhost:8000/api/*`.

Check `frontend/vite.config.ts` - it should have proxy configuration.

## Common Issues & Fixes

### Issue 1: API Server Not Running
**Symptom:** All API calls fail with "Failed to fetch" or network errors

**Fix:**
```powershell
cd E:\Projects\ing26\public_html
php -S localhost:8000 api/router.php
```

### Issue 2: CORS Errors
**Symptom:** Browser console shows CORS errors

**Fix:** Check `public_html/api/router.php` or `public_html/api/index.php` for CORS headers:
```php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
```

### Issue 3: Database Connection Issues
**Symptom:** API returns 500 errors

**Fix:** 
- Check MySQL is running
- Verify database credentials in `public_html/api/config/database.php`
- Test database connection

### Issue 4: No Data in Database
**Symptom:** API returns success but empty data arrays

**Fix:**
- Check if tables have data
- For banners: Make sure `is_active = 1`
- For news: Make sure `is_published = 1`
- For collaborations: Make sure `is_active = 1`

### Issue 5: Admin Login Not Working
**Symptom:** Login fails or redirects incorrectly

**Possible causes:**
1. **Wrong credentials** - Check admin username/password in database
2. **Session issues** - Clear browser cookies
3. **CSRF token issues** - Check browser console for CSRF errors
4. **API not accessible** - Make sure API server is running

**Fix:**
1. Check if admin user exists in database:
   ```sql
   SELECT * FROM admins;
   ```
2. Reset admin password if needed
3. Clear browser cookies and try again
4. Check browser console for errors

## Step-by-Step Fix

1. **Start API Server:**
   ```powershell
   cd E:\Projects\ing26\public_html
   php -S localhost:8000 api/router.php
   ```

2. **Test API:**
   ```powershell
   cd E:\Projects\ing26
   php test_api_endpoints.php
   ```

3. **Check Browser Console:**
   - Open `http://localhost:5173`
   - Press F12
   - Check Console and Network tabs

4. **Verify Database Has Data:**
   - Open phpMyAdmin
   - Check `banners` table (should have hero and flash_news types)
   - Check `news` table (should have published items)
   - Check `collaborations` table (should have active items)

5. **If Still Not Working:**
   - Share the browser console errors
   - Share the output of `test_api_endpoints.php`
   - Check if Vite dev server is running on port 5173

