# Fix Vocation Camp News Date

The news item "Vocation Camp for Assam Plain Region Inaugurated at Dimakuchi" has an incorrect published date (January 2, 2026 instead of December 27, 2025).

## Option 1: Run SQL Script Directly (Recommended)

1. Open MySQL command line or phpMyAdmin
2. Select your database: `cmd_ing_guwahati`
3. Run the SQL script:

```sql
UPDATE news 
SET published_at = '2025-12-27 00:00:00'
WHERE title LIKE '%Vocation Camp for Assam Plain Region%' 
   OR slug LIKE '%vocation-camp-assam-plain-region%'
   OR title LIKE '%Vocation Camp%Dimakuchi%';
```

Or use the provided SQL file:
```bash
mysql -u root -p cmd_ing_guwahati < database/fix_vocation_camp_date.sql
```

## Option 2: Use PHP Script (Requires Admin Login)

1. Make sure you're logged in as admin
2. Access the script via browser:
   ```
   http://localhost:8000/setup/fix_vocation_camp_date.php
   ```
   Or via API:
   ```
   http://localhost:8000/api/setup/fix_vocation_camp_date.php
   ```

## Option 3: Update via Admin Panel

1. Go to Admin → News Management
2. Find the news item "Vocation Camp for Assam Plain Region Inaugurated at Dimakuchi"
3. Click "Edit"
4. Update the "Published Date" field to: `2025-12-27`
5. Save the changes

## Verification

After updating, verify the date is correct:

```sql
SELECT id, title, published_at, DATE_FORMAT(published_at, '%M %d, %Y') as formatted_date
FROM news 
WHERE title LIKE '%Vocation Camp%';
```

The formatted date should show: **December 27, 2025**

