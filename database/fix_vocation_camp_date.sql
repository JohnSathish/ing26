-- Fix the published_at date for "Vocation Camp for Assam Plain Region Inaugurated at Dimakuchi"
-- Correct date: December 27, 2025
-- Current incorrect date: January 2, 2026

UPDATE news 
SET published_at = '2025-12-27 00:00:00'
WHERE title LIKE '%Vocation Camp for Assam Plain Region%' 
   OR slug LIKE '%vocation-camp-assam-plain-region%'
   OR title LIKE '%Vocation Camp%Dimakuchi%';

-- Verify the update
SELECT id, title, slug, published_at, DATE_FORMAT(published_at, '%M %d, %Y') as formatted_date
FROM news 
WHERE title LIKE '%Vocation Camp%' 
   OR slug LIKE '%vocation-camp%';

