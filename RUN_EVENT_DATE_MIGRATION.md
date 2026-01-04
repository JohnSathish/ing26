# Add event_date Column to Database

## Quick Fix - Run This SQL

Open phpMyAdmin or MySQL command line and run:

```sql
ALTER TABLE news ADD COLUMN event_date DATE NULL AFTER published_at;
ALTER TABLE news ADD INDEX idx_event_date (event_date);
```

## Or Use the PHP Script

1. Open your browser and go to:
   ```
   http://localhost:8000/api/setup/add_event_date.php
   ```

2. The script will:
   - Check if the column exists
   - Add the column if it doesn't exist
   - Add an index for performance
   - Verify the column was created

3. **IMPORTANT**: Delete the file `public_html/api/setup/add_event_date.php` after running it for security.

## Or Use Command Line

```bash
mysql -u root -p cmd_ing_guwahati < database/add_event_date.sql
```

## Verify Column Exists

Run this SQL to check:
```sql
SHOW COLUMNS FROM news LIKE 'event_date';
```

You should see the column details if it exists.

## After Migration

1. Refresh your browser
2. Try saving a news item with an event date
3. The event date should now save correctly

