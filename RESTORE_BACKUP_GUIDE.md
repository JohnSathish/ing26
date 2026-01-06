# Restore Backup Guide

## Quick Restore Steps

### Option 1: If your backup is a ZIP/RAR file

**Step 1: Locate your backup file**
- Check if it's one of these files in your project:
  - `public_html.zip`
  - `public_html.rar`
  - `public_html/api.zip`
  - `public_html/newsite.zip`
  - `public_html/uploads.zip`

**Step 2: Extract the backup**

For ZIP file:
```powershell
# Navigate to project root
cd E:\Projects\ing26

# Extract to a temporary location first
Expand-Archive -Path "path/to/your/backup.zip" -DestinationPath "restore_temp" -Force

# Review what's in the backup
Get-ChildItem -Recurse restore_temp
```

For RAR file:
```powershell
# You may need WinRAR or 7-Zip installed
# Or use PowerShell with 7-Zip if installed
```

**Step 3: Restore files**

```powershell
# Backup current state first (safety measure)
Copy-Item -Path "frontend" -Destination "frontend_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
Copy-Item -Path "public_html" -Destination "public_html_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse

# Restore from extracted backup
# Replace "restore_temp" with your extracted folder path
Copy-Item -Path "restore_temp\*" -Destination "." -Recurse -Force
```

### Option 2: If your backup is in a different location

**Tell me the backup location and I'll help you restore it!**

Examples:
- `C:\Users\YourName\Desktop\backup.zip`
- `D:\Backups\ing26_backup_2026-01-05.zip`
- External drive path

### Option 3: Restore from Git (if changes were committed)

```powershell
# See all commits
git log --oneline --all

# Restore from a specific commit
git checkout COMMIT_HASH -- .

# Or restore specific files
git checkout COMMIT_HASH -- frontend/src/App.tsx
```

## What to Tell Me

Please provide:
1. **Backup file location** - Where is your backup file?
2. **Backup format** - Is it ZIP, RAR, or a folder?
3. **What was modified** - What specific changes did you make yesterday?
   - Frontend changes?
   - Backend/API changes?
   - Database changes?
   - Configuration files?

## Safety First!

**Before restoring, let's create a backup of current state:**

```powershell
cd E:\Projects\ing26

# Create timestamped backup
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
Compress-Archive -Path "frontend", "public_html" -DestinationPath "current_state_backup_$timestamp.zip"
```

This way, if something goes wrong, you can restore the current state too!

