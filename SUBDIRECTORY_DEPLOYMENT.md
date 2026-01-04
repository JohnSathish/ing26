# Deploying to Subdirectory (/newsite/)

This guide covers deploying your React + PHP application to a subdirectory when WordPress or another site is already in the root.

## 📋 Configuration Changes Required

### Step 1: Update Vite Config for Subdirectory

**File:** `frontend/vite.config.ts`

Change the `base` path:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/newsite/',  // ← Changed from '/'
  // ... rest of config
});
```

### Step 2: Rebuild React App

```bash
cd frontend
npm run build
```

This will create files in `public_html/` with the correct base path.

### Step 3: Upload to Subdirectory

**Upload structure:**
```
public_html/
└── newsite/          ← Create this folder
    ├── index.html
    ├── .htaccess     ← Use the subdirectory version
    ├── assets/
    └── api/
        ├── .htaccess ← Use the subdirectory version
        └── ...
```

### Step 4: Use Subdirectory-Specific .htaccess Files

I've created two `.htaccess` files for you:

1. **`public_html/newsite/.htaccess`** - Main .htaccess for the subdirectory
2. **`public_html/newsite/api/.htaccess`** - API routing for subdirectory

**Important:** These files have `RewriteBase /newsite/` instead of `RewriteBase /`

---

## 🔧 File Structure on Server

Your server structure should be:

```
public_html/
├── (WordPress files)  ← Don't touch these
└── newsite/           ← Your new site
    ├── index.html
    ├── .htaccess
    ├── assets/
    │   ├── index-xxxxx.js
    │   └── index-xxxxx.css
    ├── api/
    │   ├── .htaccess
    │   ├── index.php
    │   └── ...
    └── uploads/
        └── images/
```

---

## ✅ Verification Steps

1. **Test homepage:**
   - Visit: `https://donboscoguwahati.org/newsite/`
   - Should load your React app

2. **Test API:**
   - Visit: `https://donboscoguwahati.org/newsite/api/auth/check`
   - Should return JSON

3. **Test React routes:**
   - Visit: `https://donboscoguwahati.org/newsite/login`
   - Should load login page

---

## 🚨 Common Issues

### Issue: Assets Not Loading (404 for JS/CSS)

**Solution:**
- Rebuild with `base: '/newsite/'` in `vite.config.ts`
- Verify `assets/` folder is in `public_html/newsite/`

### Issue: API Returns 404

**Solution:**
- Check `public_html/newsite/api/.htaccess` exists
- Verify `RewriteBase /newsite/api/` in the file
- Check file permissions (644)

### Issue: React Routes Return 404

**Solution:**
- Check `public_html/newsite/.htaccess` exists
- Verify `RewriteBase /newsite/` in the file
- Ensure mod_rewrite is enabled

---

## 📝 Quick Checklist

- [ ] Updated `vite.config.ts` with `base: '/newsite/'`
- [ ] Rebuilt React app (`npm run build`)
- [ ] Created `public_html/newsite/` folder
- [ ] Uploaded all files to `newsite/` folder
- [ ] Uploaded subdirectory `.htaccess` files
- [ ] Created `uploads/` folder in `newsite/`
- [ ] Set file permissions (644/755)
- [ ] Tested: `https://donboscoguwahati.org/newsite/`

---

## 🔄 When Ready for Production

When you're ready to move to root:

1. Change `base: '/'` back in `vite.config.ts`
2. Rebuild
3. Move files from `newsite/` to `public_html/` root
4. Use root `.htaccess` files
5. Update database if needed

---

Good luck! 🚀

