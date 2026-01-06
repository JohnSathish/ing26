# Cursor IDE File Safety Guide

## What Happened?

**Your files were NOT deleted by Cursor IDE.** Here's what actually happened:

### The Real Issue

1. **App.tsx was overwritten** - The main App.tsx file was accidentally replaced with the default Vite template
2. **constants.ts was deleted** - This file was deleted (possibly manually or by a cleanup script)
3. **Component files are SAFE** - All your component files (Header, News, Footer, etc.) exist and are intact

### Why It Seemed Like Files Were Deleted

- When App.tsx was overwritten, the app showed the default Vite page
- This made it appear like components were missing
- But the files were actually still on disk - just not being used

## How to Prevent This

### 1. **Use Git Regularly**
```powershell
# Check status before making changes
git status

# Commit frequently
git add .
git commit -m "Your message"

# If something goes wrong, restore from git
git checkout HEAD -- path/to/file
```

### 2. **Enable Auto-Save in Cursor**
- Go to Settings → Editor → Files
- Enable "Auto Save" (after delay or on focus change)

### 3. **Use File History**
- Right-click any file → "Open Timeline"
- See all changes and restore previous versions

### 4. **Backup Important Files**
```powershell
# Create a backup before major changes
Copy-Item -Path "frontend/src/App.tsx" -Destination "frontend/src/App.tsx.backup"
```

### 5. **Check Before Overwriting**
- When Cursor suggests replacing a file, review the changes
- Use "Compare" to see differences
- Don't accept large replacements without reviewing

## If Files Go Missing

### Step 1: Check Git Status
```powershell
git status
```

### Step 2: Restore from Git
```powershell
# Restore specific file
git checkout HEAD -- path/to/file

# Restore all deleted files
git checkout HEAD -- .
```

### Step 3: Check File System
```powershell
# Verify files exist on disk
Get-ChildItem -Recurse -Path "frontend/src/components" | Select-Object FullName
```

## Common Scenarios

### Scenario 1: File Overwritten
**Symptom:** App shows default Vite page  
**Solution:** Restore App.tsx from git
```powershell
git checkout HEAD -- frontend/src/App.tsx
```

### Scenario 2: Import Errors
**Symptom:** "Cannot find module" errors  
**Solution:** Check if constants.ts exists
```powershell
git checkout HEAD -- frontend/src/utils/constants.ts
```

### Scenario 3: Component Not Found
**Symptom:** Component import fails  
**Solution:** Verify file exists on disk
```powershell
Test-Path "frontend/src/components/Header/Header.tsx"
```

## Best Practices

1. ✅ **Commit before major changes**
2. ✅ **Review file changes before accepting**
3. ✅ **Use git branches for experiments**
4. ✅ **Keep a backup of critical files**
5. ✅ **Check git status regularly**

## Quick Recovery Commands

```powershell
# Restore all modified files
git checkout HEAD -- .

# Restore specific directory
git checkout HEAD -- frontend/src/

# See what was deleted
git status | Select-String "deleted"

# Restore deleted files
git checkout HEAD -- frontend/src/utils/constants.ts
```

## Conclusion

**Cursor IDE does NOT delete files automatically.** Files can be:
- Overwritten by user actions
- Deleted manually
- Modified by scripts
- Lost due to power failure (if not saved)

**Always use git to track changes and recover files!**

