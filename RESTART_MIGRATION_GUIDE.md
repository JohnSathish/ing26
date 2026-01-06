# Restart Migration After Power Failure

## Quick Start

### Step 1: Start PHP Server

Open a **new terminal/PowerShell window** and run:

```powershell
cd E:\Projects\ing26\public_html
php -S localhost:8000 api/router.php
```

**Keep this window open** - the server must be running during migration.

### Step 2: Update Credentials

Edit `resume_migration.php` and update your admin credentials:

```php
$username = 'your_admin_username';
$password = 'your_admin_password';
```

### Step 3: Run Resume Script

In a **separate terminal/PowerShell window**, run:

```powershell
cd E:\Projects\ing26
php resume_migration.php
```

## What the Resume Script Does

✅ **Checks existing items** - Queries the database to see what's already migrated  
✅ **Skips duplicates** - Automatically skips news items that already exist  
✅ **Continues from start** - Processes all pages but only migrates missing items  
✅ **Handles session timeouts** - Automatically re-authenticates if session expires  
✅ **Logs everything** - Creates `resume_migration_log.txt` with detailed progress  

## Safe to Run Multiple Times

The resume script is **safe to run multiple times**:
- It checks each item before migrating
- Won't create duplicates
- Can be stopped and restarted anytime

## Check Migration Status

### Option 1: Check Log File
```powershell
# View last 50 lines
Get-Content resume_migration_log.txt -Tail 50

# Count successful migrations
Select-String -Path resume_migration_log.txt -Pattern "\[SUCCESS\]" | Measure-Object | Select-Object -ExpandProperty Count
```

### Option 2: Check Database
Log into your admin panel and check the News Management page to see how many items are in the database.

## Troubleshooting

### "Connection failed" Error
- Make sure PHP server is running on port 8000
- Check that `api/router.php` exists in `public_html/api/`

### "Failed to authenticate" Error
- Verify your username and password in `resume_migration.php`
- Make sure you're using the correct admin credentials

### "Cookie file" Errors
- The script automatically handles cookie files
- If issues persist, delete any `migration_cookies_*.txt` files in your temp directory

### Migration Stops Midway
- Simply restart the script - it will skip already-migrated items
- Check the log file to see where it stopped

## Expected Behavior

When you run `resume_migration.php`:

1. **First run after power failure:**
   - Checks all 58 pages
   - Skips items already in database (from previous run)
   - Migrates only missing items
   - Logs everything to `resume_migration_log.txt`

2. **Subsequent runs:**
   - Will skip everything (all items already exist)
   - Very fast - just checks and skips

## Migration Progress

The script will show:
- `[INFO] Processing page X of 58`
- `[INFO] Found Y items on page X`
- `[INFO] Skipping (already exists): [Title]` - Item already migrated
- `[SUCCESS] Successfully migrated: [Title]` - New item migrated
- `[ERROR] Failed to migrate: [Title]` - Item failed (will retry on next run)

## Final Summary

At the end, you'll see:
```
=== Migration completed ===
Total migrated: X
Total skipped (already exist): Y
Total failed: Z
```

## Next Steps After Migration

1. **Check failed items** - Review `resume_migration_log.txt` for any `[ERROR]` entries
2. **Verify in admin panel** - Check News Management page
3. **Test frontend** - Visit homepage to see news items displayed

---

**Note:** The original migration log (`migration_log.txt`) shows 307 items were successfully migrated before the power failure. The resume script will check which of those 307 are in the database and continue with any missing items.

