# Dynamic Pages Management System

## Overview
The dynamic pages system allows you to create and manage custom pages from the admin panel without hardcoding them. Pages can be added to the main menu or as submenus under existing menu items.

## Features
- ✅ Create, edit, and delete pages from admin panel
- ✅ Rich text editor with image support
- ✅ Add pages to main menu or submenus
- ✅ Enable/disable pages
- ✅ SEO meta tags (title and description)
- ✅ Featured images
- ✅ Sort order control
- ✅ Automatic slug generation

## Database Setup

Run the database migration to create the `pages` table:

```sql
-- Run this SQL file
database/add_pages_table.sql
```

Or execute the SQL directly:
```sql
CREATE TABLE IF NOT EXISTS pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  featured_image VARCHAR(255),
  menu_label VARCHAR(255),
  menu_position INT DEFAULT 0,
  parent_menu VARCHAR(100) DEFAULT NULL,
  is_submenu BOOLEAN DEFAULT FALSE,
  is_enabled BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  show_in_menu BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_slug (slug),
  INDEX idx_enabled (is_enabled),
  INDEX idx_menu (show_in_menu, parent_menu, sort_order),
  INDEX idx_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Admin Panel Usage

### Accessing Pages Management
1. Log in to the admin panel
2. Navigate to **Pages** → **Dynamic Pages** in the sidebar

### Creating a New Page

1. Click **"+ Create New Page"** button
2. Fill in the form:
   - **Title**: Page title (required)
   - **Slug**: URL-friendly identifier (auto-generated from title, can be edited)
   - **Menu Label**: Text shown in menu (defaults to title)
   - **Parent Menu**: Select parent menu item (About Us, ING Provincials, Council, Houses, or Main Menu)
   - **Sort Order**: Number to control menu order (lower numbers appear first)
   - **Menu Position**: Additional positioning control
   - **Content**: Rich text content with formatting and images
   - **Excerpt**: Short description
   - **Featured Image**: Upload an image for the page
   - **Meta Title**: SEO title (defaults to page title)
   - **Meta Description**: SEO description
   - **Enabled**: Toggle to enable/disable the page
   - **Show in Menu**: Toggle to show/hide in navigation
   - **Is Submenu**: Mark as submenu item
   - **Featured**: Mark as featured page

3. Click **"Create Page"**

### Editing a Page

1. Find the page in the list
2. Click **"Edit"** button
3. Make changes
4. Click **"Update Page"**

### Deleting a Page

1. Find the page in the list
2. Click **"Delete"** button
3. Confirm deletion

## Menu Integration

### Main Menu Items
- Pages with no parent menu appear in the main navigation bar
- They are sorted by `sort_order` (ascending)

### Submenu Items
- Pages with a parent menu appear under that parent's dropdown
- Available parent menus:
  - **About Us**: Appears under "About Us" dropdown
  - **ING Provincials**: Appears under "ING Provincials" dropdown
  - **Council**: Appears under "Council" dropdown
  - **Houses**: Appears under "Houses" dropdown

### Menu Ordering
- Pages are sorted by `sort_order` field (ascending)
- Lower numbers appear first
- If sort orders are equal, pages are sorted by creation date

## Page URLs

Dynamic pages are accessible at:
```
/page/{slug}
```

For example, if you create a page with slug `contact-us`, it will be accessible at:
```
/page/contact-us
```

## API Endpoints

### List Pages
```
GET /api/pages/list?page=1&limit=20&enabled_only=true
```

### Get Single Page
```
GET /api/pages/get?slug={slug}
```

### Create Page (Admin Only)
```
POST /api/pages/create
Content-Type: application/json

{
  "title": "Page Title",
  "slug": "page-slug",
  "content": "<p>HTML content</p>",
  "excerpt": "Short description",
  "menu_label": "Menu Label",
  "parent_menu": "about",
  "sort_order": 0,
  "is_enabled": true,
  "show_in_menu": true
}
```

### Update Page (Admin Only)
```
PUT /api/pages/update?id={id}
Content-Type: application/json

{
  "title": "Updated Title",
  ...
}
```

### Delete Page (Admin Only)
```
DELETE /api/pages/delete?id={id}
```

## Best Practices

1. **Slugs**: Use lowercase, hyphens, and no special characters
   - ✅ Good: `contact-us`, `about-our-mission`
   - ❌ Bad: `Contact Us!`, `about/our/mission`

2. **Menu Organization**: 
   - Use parent menus to group related pages
   - Use sort_order to control display order
   - Keep menu labels concise

3. **Content**:
   - Use the rich text editor for formatting
   - Upload images using the image button
   - Use bulk upload for multiple images

4. **SEO**:
   - Always fill in meta title and description
   - Use descriptive, keyword-rich titles
   - Keep meta descriptions under 160 characters

5. **Testing**:
   - Test pages after creation
   - Verify menu placement
   - Check mobile responsiveness

## Troubleshooting

### Page Not Showing in Menu
- Check that `is_enabled` is `true`
- Check that `show_in_menu` is `true`
- Verify `parent_menu` matches an existing menu item
- Check `sort_order` - pages with lower numbers appear first

### Page Not Loading
- Verify the page is enabled (`is_enabled = true`)
- Check the slug is correct
- Ensure the page hasn't been deleted

### Menu Items Not Appearing
- Clear browser cache
- Check that pages are enabled and set to show in menu
- Verify parent_menu values match exactly (case-sensitive)

## Technical Details

- **Frontend Route**: `/page/:slug`
- **Component**: `DynamicPage.tsx`
- **Admin Component**: `PagesManagement.tsx`
- **Database Table**: `pages`
- **Soft Delete**: Pages are soft-deleted (deleted_at timestamp)

