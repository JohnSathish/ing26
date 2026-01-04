# Fix API Routing for /newsite/ Subdirectory

## The Problem

API requests are returning WordPress 404 pages instead of JSON responses because:
1. Frontend is making requests to `/api/...` instead of `/newsite/api/...`
2. WordPress `.htaccess` is catching these requests before they reach the React app's API

## ✅ Solution Applied

### 1. Updated All API Endpoints

**File:** `frontend/src/utils/constants.ts`

Changed all API endpoints from `/api/...` to `/newsite/api/...`:

- ✅ `API_BASE_URL`: `/api` → `/newsite/api`
- ✅ All `API_ENDPOINTS`: `/api/...` → `/newsite/api/...`

### 2. Fixed .htaccess Routing

**File:** `public_html/newsite/.htaccess`

Updated API routing rule to use absolute path:

```apache
RewriteRule ^api/(.*)$ /newsite/api/index.php [QSA,L]
```

## 🚀 Next Steps

### Step 1: Rebuild React App

```bash
cd frontend
npm run build
```

This will update all API calls in the built JavaScript files.

### Step 2: Upload Files

Upload the newly built files to `public_html/newsite/`:
- `index.html`
- `assets/` folder (with updated JS files)
- `.htaccess` file (updated routing)

### Step 3: Test API

After uploading, test these URLs:

1. **API Check:**
   ```
   https://donboscoguwahati.org/newsite/api/auth/check
   ```
   Should return JSON: `{"authenticated": false}`

2. **Banners:**
   ```
   https://donboscoguwahati.org/newsite/api/banners/list
   ```
   Should return JSON, not WordPress 404

3. **Settings:**
   ```
   https://donboscoguwahati.org/newsite/api/settings/get
   ```
   Should return JSON, not WordPress 404

## ✅ Summary

- ✅ All API endpoints updated to `/newsite/api/...`
- ✅ `.htaccess` routing fixed
- ⏳ **Rebuild required** - Run `npm run build`
- ⏳ **Upload required** - Upload new files to server

After rebuilding and uploading, all API calls should work correctly! 🎉

