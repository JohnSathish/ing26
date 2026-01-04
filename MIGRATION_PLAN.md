# Migration Plan: WordPress to React + PHP Application

## Current Site Analysis (https://donboscoguwahati.org/)

### Existing Site Structure

**Main Navigation:**
- Home
- About Us (Our Vision, Our Mission)
- ING Provincials (Vice Provincials, Economers, ING Provincial Secretaries)
- Don Bosco
- GC29 (General Chapter 29)
- Houses (6 Dioceses: Bongaigaon, Diphu, Guwahati Archdiocese, Nongstoin, Tezpur, Tura)
- Council (Councillors 2024-2025, Dimensions, Commissions)
- NewsLine (Monthly archives from 2015-2025)
- Circulars (Monthly archives from 2019-2025)
- Gallery (Photos, Video)

**Homepage Sections:**
1. Header with social media links
2. Main News section (featured articles)
3. Birthday Wishes (dynamic cards)
4. STRENNA 2025 section
5. Rector Major and His Council
6. Houses section (6 dioceses)
7. Provincial Message (Fr. Sebastian Mathew Kuricheal)
8. Quick Links
9. Collaborations/Partners
10. About Us summary
11. Online NewsLine QR code
12. Footer with social links

**Content Types:**
- News articles (with categories: Main News, Birthday Wishes, Popular, Update)
- Birthday wishes (with images)
- Circulars (monthly archives)
- NewsLine (monthly magazine archives)
- Gallery items (photos, videos)
- Provincial information
- House/Diocese information
- Council members
- Commissions
- Collaborations/Partners

---

## New Application Status

### ✅ Already Implemented:
- Birthday Wishes (CRUD)
- News (CRUD)
- Messages (Provincial Message)
- Houses (CRUD)
- Banners (Hero, Flash News)
- Authentication & Admin Dashboard
- Basic homepage structure

### ❌ Missing Features:
1. **Circulars** - Monthly circular management
2. **NewsLine** - Monthly magazine/NewsLine management
3. **Gallery** - Photo and video gallery
4. **About Us** - Vision, Mission pages
5. **ING Provincials** - Vice Provincials, Economers, Secretaries
6. **Don Bosco** - Content page
7. **GC29** - General Chapter 29 content
8. **Council** - Councillors, Dimensions, Commissions
9. **Quick Links** - Dynamic links management
10. **Collaborations** - Partners/Sponsors management
11. **Social Media Links** - Dynamic social links
12. **NewsLine QR Code** - Dynamic QR code generation
13. **News Categories** - Main News, Birthday Wishes, Popular, Update
14. **Archive System** - Monthly/yearly archives for NewsLine and Circulars

---

## Migration Strategy

### Phase 1: Database Schema Updates

#### New Tables Needed:

**circulars**
```sql
CREATE TABLE circulars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    file_path VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE KEY unique_month_year (year, month),
    INDEX idx_year_month (year, month)
);
```

**newsline**
```sql
CREATE TABLE newsline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    cover_image VARCHAR(255),
    pdf_path VARCHAR(255),
    qr_code_url VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE KEY unique_month_year (year, month),
    INDEX idx_year_month (year, month)
);
```

**gallery**
```sql
CREATE TABLE gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type ENUM('photo', 'video') NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    thumbnail VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_type (type),
    INDEX idx_category (category)
);
```

**provincials**
```sql
CREATE TABLE provincials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title ENUM('provincial', 'vice_provincial', 'economer', 'secretary') NOT NULL,
    image VARCHAR(255),
    bio TEXT,
    period_start DATE,
    period_end DATE,
    is_current BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_is_current (is_current)
);
```

**council_members**
```sql
CREATE TABLE council_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    image VARCHAR(255),
    bio TEXT,
    dimension VARCHAR(100),
    commission VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dimension (dimension),
    INDEX idx_commission (commission)
);
```

**commissions**
```sql
CREATE TABLE commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**quick_links**
```sql
CREATE TABLE quick_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    icon VARCHAR(255),
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**collaborations**
```sql
CREATE TABLE collaborations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    description TEXT,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**settings**
```sql
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(50) DEFAULT 'text',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Updates to Existing Tables:

**news** - Add category field:
```sql
ALTER TABLE news ADD COLUMN category ENUM('main_news', 'birthday_wishes', 'popular', 'update') DEFAULT 'main_news';
ALTER TABLE news ADD INDEX idx_category (category);
```

---

### Phase 2: Backend API Endpoints

#### New Endpoints Needed:

**Circulars:**
- `GET /api/circulars/list` - List circulars (with year/month filters)
- `GET /api/circulars/archive` - Get archive structure
- `POST /api/circulars/create` - Create circular (admin)
- `PUT /api/circulars/update` - Update circular (admin)
- `DELETE /api/circulars/delete` - Delete circular (admin)

**NewsLine:**
- `GET /api/newsline/list` - List NewsLine issues
- `GET /api/newsline/archive` - Get archive structure
- `GET /api/newsline/current` - Get current/latest issue
- `POST /api/newsline/create` - Create issue (admin)
- `PUT /api/newsline/update` - Update issue (admin)
- `DELETE /api/newsline/delete` - Delete issue (admin)

**Gallery:**
- `GET /api/gallery/list` - List gallery items (with type filter)
- `GET /api/gallery/categories` - Get categories
- `POST /api/gallery/create` - Upload item (admin)
- `PUT /api/gallery/update` - Update item (admin)
- `DELETE /api/gallery/delete` - Delete item (admin)

**Provincials:**
- `GET /api/provincials/list` - List provincials (with title filter)
- `GET /api/provincials/current` - Get current provincial
- `POST /api/provincials/create` - Create (admin)
- `PUT /api/provincials/update` - Update (admin)
- `DELETE /api/provincials/delete` - Delete (admin)

**Council:**
- `GET /api/council/list` - List council members
- `GET /api/council/dimensions` - Get dimensions
- `GET /api/council/commissions` - Get commissions
- `POST /api/council/create` - Create member (admin)
- `PUT /api/council/update` - Update member (admin)
- `DELETE /api/council/delete` - Delete member (admin)

**Settings:**
- `GET /api/settings` - Get all settings
- `GET /api/settings/{key}` - Get specific setting
- `PUT /api/settings/{key}` - Update setting (admin)

**Quick Links & Collaborations:**
- `GET /api/quick-links/list`
- `POST /api/quick-links/create` (admin)
- Similar for collaborations

---

### Phase 3: Frontend Components

#### New Components Needed:

**Pages:**
- `AboutUs.tsx` - About Us page (Vision, Mission)
- `DonBosco.tsx` - Don Bosco content page
- `GC29.tsx` - General Chapter 29 page
- `Provincials.tsx` - ING Provincials listing
- `Council.tsx` - Council members, dimensions, commissions
- `Circulars.tsx` - Circulars archive page
- `NewsLine.tsx` - NewsLine archive page
- `Gallery.tsx` - Photo/video gallery
- `HouseDetail.tsx` - Individual house/diocese detail page

**Components:**
- `CircularsArchive.tsx` - Monthly archive navigation
- `NewsLineArchive.tsx` - Monthly archive navigation
- `GalleryGrid.tsx` - Gallery display with filters
- `ProvincialCard.tsx` - Provincial information card
- `CouncilMemberCard.tsx` - Council member card
- `CommissionCard.tsx` - Commission card
- `QuickLinks.tsx` - Quick links widget
- `Collaborations.tsx` - Partners/sponsors display
- `QRCode.tsx` - QR code generator/display
- `SocialLinks.tsx` - Dynamic social media links

**Admin Pages:**
- `CircularsManagement.tsx`
- `NewsLineManagement.tsx`
- `GalleryManagement.tsx`
- `ProvincialsManagement.tsx`
- `CouncilManagement.tsx`
- `CommissionsManagement.tsx`
- `QuickLinksManagement.tsx`
- `CollaborationsManagement.tsx`
- `SettingsManagement.tsx`

---

### Phase 4: Content Migration

#### Data Export from WordPress:

1. **Export WordPress Data:**
   - Use WordPress export tool
   - Or use WP-CLI: `wp db export`
   - Or use phpMyAdmin to export tables

2. **Content Mapping:**
   - WordPress Posts → News articles
   - WordPress Pages → Static content (About Us, Don Bosco, etc.)
   - WordPress Media → Gallery items
   - Custom Post Types → Circulars, NewsLine
   - WordPress Users → Admins (if needed)

3. **Migration Script:**
   - Create PHP script to import WordPress data
   - Map WordPress categories to new categories
   - Convert WordPress content format to new format
   - Migrate images/files to uploads directory

#### Manual Migration Checklist:

- [ ] Export all news articles
- [ ] Export circulars (PDFs and metadata)
- [ ] Export NewsLine issues (PDFs and metadata)
- [ ] Export gallery images/videos
- [ ] Export provincial information
- [ ] Export council member data
- [ ] Export house/diocese descriptions
- [ ] Export settings (social links, contact info)
- [ ] Export collaborations/partners
- [ ] Export quick links

---

### Phase 5: URL Structure & SEO

#### URL Mapping:

**Old WordPress URLs → New React Routes:**

- `/` → `/` (Home)
- `/about-us/` → `/about-us`
- `/about-us/our-vision/` → `/about-us#vision`
- `/about-us/our-mission/` → `/about-us#mission`
- `/ing-provincials/` → `/provincials`
- `/don-bosco/` → `/don-bosco`
- `/gc29/` → `/gc29`
- `/houses/` → `/houses`
- `/houses/bongaigaon-diocese/` → `/houses/bongaigaon`
- `/council/` → `/council`
- `/newsline/` → `/newsline`
- `/newsline/december-2025/` → `/newsline/2025/12`
- `/circulars/` → `/circulars`
- `/circulars/december-2025/` → `/circulars/2025/12`
- `/gallery/` → `/gallery`
- `/gallery/photos/` → `/gallery?type=photo`
- `/gallery/video/` → `/gallery?type=video`

#### SEO Considerations:

- Implement proper meta tags for each page
- Add Open Graph tags
- Implement structured data (JSON-LD)
- Create sitemap.xml
- Set up 301 redirects for old URLs (via .htaccess or server config)
- Implement canonical URLs

---

### Phase 6: Implementation Priority

#### High Priority (Core Functionality):
1. ✅ Birthday Wishes (Done)
2. ✅ News (Done)
3. ✅ Houses (Done)
4. ✅ Provincial Message (Done)
5. ⚠️ NewsLine (Critical - main content)
6. ⚠️ Circulars (Critical - main content)
7. ⚠️ Gallery (Important for visual content)

#### Medium Priority (Content Pages):
8. About Us page
9. Don Bosco page
10. GC29 page
11. Provincials listing
12. Council pages

#### Low Priority (Enhancements):
13. Quick Links management
14. Collaborations management
15. Advanced gallery features
16. Search functionality
17. Newsletter subscription

---

### Phase 7: Testing & Validation

#### Testing Checklist:

- [ ] All pages load correctly
- [ ] All API endpoints work
- [ ] Admin can manage all content types
- [ ] Images/files upload correctly
- [ ] Archive navigation works
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] SEO meta tags
- [ ] Performance optimization
- [ ] Security testing

---

## Next Steps

1. **Review this plan** and prioritize features
2. **Create database schema updates** for new tables
3. **Implement missing API endpoints**
4. **Build missing frontend components**
5. **Create migration scripts** for WordPress data
6. **Test thoroughly** before going live
7. **Set up redirects** for old URLs
8. **Deploy gradually** (staging → production)

---

## Estimated Timeline

- **Phase 1-2** (Database + API): 2-3 days
- **Phase 3** (Frontend Components): 3-4 days
- **Phase 4** (Content Migration): 1-2 days
- **Phase 5** (SEO & URLs): 1 day
- **Phase 6-7** (Testing): 1-2 days

**Total: 8-12 days** for complete migration

---

## Notes

- Keep old site running during migration
- Use staging environment for testing
- Backup everything before migration
- Test with real content before going live
- Plan for downtime during final migration
- Have rollback plan ready

