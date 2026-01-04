-- Update Province Image Setting
-- Run this SQL in phpMyAdmin to set the province image

INSERT INTO settings (key_name, value, type)
VALUES ('province_image', '/uploads/images/provincial-house.jpg', 'text')
ON DUPLICATE KEY UPDATE value = '/uploads/images/provincial-house.jpg', type = 'text';

-- Verify the setting was saved
SELECT * FROM settings WHERE key_name = 'province_image';

