# Fix 404 Error for /newsite/ Subdirectory

## The Problem

Getting `404 (Not Found)` when accessing `https://donboscoguwahati.org/newsite/`

## Root Causes

1. **React Router needs basename** - BrowserRouter must know it's in a subdirectory
2. **.htaccess routing** - Needs proper rules for subdirectory
3. **Assets path** - Must match the base path

## ✅ Solutions Applied

### 1. Updated React Router with Basename

**File:** `frontend/src/App.tsx`

Changed:
```tsx
<BrowserRouter>
```

To:
```tsx
<BrowserRouter basename="/newsite">
```

### 2. Updated .htaccess for Subdirectory

The `.htaccess` file in `public_html/newsite/` has been updated with:
- `RewriteBase /newsite/`
- Proper API routing rules
- React routing rules that exclude API and uploads

### 3. Rebuild Required

**You MUST rebuild the React app after these changes:**

```bash
cd frontend
npm run build
```

This will:
- Update `index.html` with correct asset paths
- Update all JavaScript with the correct base path
- Create files in `public_html/newsite/`

---

## 📋 Step-by-Step Fix

### Step 1: Rebuild React App

```bash
cd frontend
npm run build
```

### Step 2: Verify Build Output

Check that `public_html/newsite/` contains:
- `index.html` (with `/newsite/assets/` paths)
- `assets/` folder with JS/CSS files
- `api/` folder

### Step 3: Upload/Verify .htaccess Files

**Main .htaccess:** `public_html/newsite/.htaccess`
- Should have `RewriteBase /newsite/`
- Should route API requests correctly
- Should route React requests to `index.html`

**API .htaccess:** `public_html/newsite/api/.htaccess`
- Should have `RewriteBase /newsite/api/`
- Should route to `index.php`

### Step 4: Test

1. **Homepage:** `https://donboscoguwahati.org/newsite/`
2. **API:** `https://donboscoguwahati.org/newsite/api/auth/check`
3. **Login:** `https://donboscoguwahati.org/newsite/login`

---

## 🔍 Troubleshooting

### Still Getting 404?

1. **Check .htaccess exists:**
   - Enable "Show Hidden Files" in File Manager
   - Verify `.htaccess` in `public_html/newsite/`
   - Verify `.htaccess` in `public_html/newsite/api/`

2. **Check file permissions:**
   - Files: **644**
   - Directories: **755**
   - `.htaccess` files: **644**

3. **Check index.html paths:**
   - Open `public_html/newsite/index.html`
   - Verify asset paths start with `/newsite/assets/`
   - If they start with `/assets/`, rebuild is needed

4. **Test API directly:**
   - Visit: `https://donboscoguwahati.org/newsite/api/auth/check`
   - Should return JSON, not 404

5. **Check error logs:**
   - cPanel → Metrics → Errors
   - Look for specific error messages

---

## 📝 Quick Checklist

- [ ] Updated `App.tsx` with `basename="/newsite"`
- [ ] Rebuilt React app (`npm run build`)
- [ ] Verified `index.html` has `/newsite/assets/` paths
- [ ] Uploaded `.htaccess` to `public_html/newsite/`
- [ ] Uploaded `.htaccess` to `public_html/newsite/api/`
- [ ] Set file permissions (644/755)
- [ ] Tested: `https://donboscoguwahati.org/newsite/`

---

## 🎯 Most Common Issue

**The React app wasn't rebuilt after changing the base path!**

**Solution:** Always rebuild after changing `vite.config.ts` base path:
```bash
cd frontend
npm run build
```

---

After rebuilding and uploading, your site should work at `https://donboscoguwahati.org/newsite/`! 🚀

