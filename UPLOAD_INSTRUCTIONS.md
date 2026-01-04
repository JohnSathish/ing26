# What to Upload to cPanel - Quick Guide

## ✅ CORRECT: Upload Contents Only

**Upload the CONTENTS of your local `public_html/` folder INTO the server's `public_html/` directory.**

### Your Local Structure:
```
E:\Projects\ing26\
└── public_html/          ← This folder stays on your computer
    ├── index.html        ← Upload this
    ├── .htaccess         ← Upload this
    ├── assets/           ← Upload this entire folder
    └── api/              ← Upload this entire folder
```

### What Should Be on Server:
```
/home/username/public_html/    ← This already exists on server
    ├── index.html             ← Uploaded here
    ├── .htaccess              ← Uploaded here
    ├── assets/                ← Uploaded here
    └── api/                   ← Uploaded here
```

## ❌ WRONG: Don't Do This

**DO NOT upload the `public_html` folder itself!**

If you upload the folder, you'll end up with:
```
/home/username/public_html/
    └── public_html/           ← WRONG! This creates a nested folder
        ├── index.html
        ├── assets/
        └── api/
```

This would make your site accessible at `https://yourdomain.com/public_html/` instead of `https://yourdomain.com/`

---

## Step-by-Step Upload Process

### Using cPanel File Manager:

1. **Open File Manager** in cPanel
2. **Navigate to `public_html/`** (click on it to enter)
3. **Click "Upload"** button
4. **Select files from your local `public_html/` folder:**
   - Select `index.html`
   - Select `assets/` folder (entire folder)
   - Select `api/` folder (entire folder)
   - Select `.htaccess` (enable "Show Hidden Files" first)
5. **Wait for upload to complete**
6. **Verify:** You should see these items directly in `public_html/`, not in a subfolder

### Using FTP Client (FileZilla, WinSCP):

1. **Connect to your server**
2. **Navigate to `/public_html/`** on the server (remote side)
3. **Open your local `public_html/` folder** on your computer (local side)
4. **Select all files and folders INSIDE your local `public_html/`:**
   - `index.html`
   - `assets/`
   - `api/`
   - `.htaccess`
5. **Drag and drop** them into the server's `public_html/` directory
6. **Verify:** Check that files are directly in `/public_html/`, not in `/public_html/public_html/`

---

## Quick Checklist

- [ ] I'm uploading files INTO `public_html/`, not creating a new folder
- [ ] `index.html` is directly in `public_html/`
- [ ] `assets/` folder is directly in `public_html/`
- [ ] `api/` folder is directly in `public_html/`
- [ ] `.htaccess` is directly in `public_html/`
- [ ] No nested `public_html/public_html/` folder exists

---

## How to Verify After Upload

1. **In File Manager:**
   - Go to `public_html/`
   - You should see `index.html`, `assets/`, `api/`, and `.htaccess` listed directly
   - If you see another `public_html/` folder inside, that's wrong!

2. **Test your site:**
   - Visit: `https://yourdomain.com/`
   - If it works, you uploaded correctly!
   - If you see 404 or need to go to `https://yourdomain.com/public_html/`, you uploaded the folder instead of contents

---

## Summary

**Upload the CONTENTS of `public_html/` INTO the server's `public_html/` directory.**

Think of it like copying files from one folder to another, not copying the folder itself!

