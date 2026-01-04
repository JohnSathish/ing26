-- Add event_date column to news table
ALTER TABLE news ADD COLUMN event_date DATE NULL AFTER published_at;

-- Add index for event_date
ALTER TABLE news ADD INDEX idx_event_date (event_date);

