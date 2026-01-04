# Fix 401 Unauthorized Error

## Problem
Getting `401 Unauthorized` when trying to update news items.

## Solution

### Step 1: Make Sure You're Logged In

1. Go to: `http://localhost:5173/login`
2. Login with your admin credentials
3. You should be redirected to the admin dashboard

### Step 2: Check Session Cookie

The session cookie settings have been updated for localhost development. If you're still getting 401:

1. **Clear your browser cookies** for localhost
2. **Log out and log back in**
3. **Hard refresh** the page (Ctrl+Shift+R)

### Step 3: Verify Session is Working

1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Check Cookies for `http://localhost:8000`
4. You should see a `PHPSESSID` cookie

### Step 4: Restart PHP Server

If the issue persists:

1. Stop the PHP server (Ctrl+C)
2. Restart it:
   ```bash
   php -S 127.0.0.1:8000 -t public_html/api public_html/api/router.php
   ```

### Step 5: Check Browser Console

Look for any CORS or cookie errors in the browser console.

## What Was Fixed

1. **Session Cookie Settings**: Updated to work with cross-origin localhost requests
   - Changed `SameSite` to `Lax` for development
   - Set `Secure` to `false` for HTTP
   - Set empty domain for localhost

2. **CORS Headers**: Added `X-Requested-With` to allowed headers

3. **Error Handling**: Added automatic redirect to login on 401 errors

## If Still Not Working

1. Make sure you're logged in at `/login`
2. Check that the PHP server is running on port 8000
3. Verify the session cookie is being set (check DevTools)
4. Try logging out and logging back in

