# Event Date Feature Setup

## Overview
Added an "Event Date" field to the News Management form, allowing you to select the date when an event occurred or will occur.

## Database Migration

Run the following SQL to add the `event_date` column to your database:

```sql
-- Add event_date column to news table
ALTER TABLE news ADD COLUMN event_date DATE NULL AFTER published_at;

-- Add index for event_date
ALTER TABLE news ADD INDEX idx_event_date (event_date);
```

Or run the migration file:
```bash
mysql -u root -p cmd_ing_guwahati < database/add_event_date.sql
```

## Features Added

1. **Date Picker Field**: A native HTML5 date picker in the News Management form
2. **Database Storage**: Event date is stored in the `event_date` column (DATE type)
3. **API Support**: Create, Update, and List endpoints now handle event_date
4. **Form Integration**: Date picker appears between "Excerpt" and "Featured Image" fields

## Usage

1. When creating or editing a news item, you'll see an "Event Date" field
2. Click the date input to open the calendar picker
3. Select the date when the event occurred or will occur
4. The date is optional - you can leave it blank if not applicable
5. The date is saved with the news item and can be displayed on the frontend

## Frontend Display

The event date is now available in the news data and can be displayed on the frontend. You can access it via:
- `newsItem.event_date` (format: YYYY-MM-DD)

## Next Steps

You may want to:
1. Display the event date on the news detail page
2. Filter news by event date
3. Show upcoming events based on event_date
4. Sort news by event_date

