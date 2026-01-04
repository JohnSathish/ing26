# Quick Deployment Checklist

Use this checklist to ensure you don't miss any steps during deployment.

## Pre-Deployment

- [ ] Build React app: `cd frontend && npm run build`
- [ ] Verify build output in `public_html/` directory
- [ ] Test locally one last time

## Database Setup

- [ ] Create database in cPanel
- [ ] Create database user
- [ ] Grant all privileges to user
- [ ] Import `database/schema.sql`
- [ ] Import `database/schema_updates.sql`
- [ ] Import `database/add_strenna_table.sql` (if needed)
- [ ] Create admin user with secure password
- [ ] Test database connection

## Configuration

- [ ] Update `public_html/api/config/database.php`:
  - [ ] DB_HOST
  - [ ] DB_NAME
  - [ ] DB_USER
  - [ ] DB_PASS
- [ ] Update `public_html/api/config/constants.php`:
  - [ ] Set `ENVIRONMENT` to `'production'`

## File Upload

- [ ] Upload `index.html`
- [ ] Upload `assets/` folder
- [ ] Upload `api/` folder (entire folder)
- [ ] Upload `.htaccess` file (show hidden files!)
- [ ] Create `uploads/` directory
- [ ] Create `uploads/images/` directory
- [ ] Set permissions:
  - [ ] Files: 644
  - [ ] Directories: 755
  - [ ] `uploads/`: 755
  - [ ] `uploads/images/`: 755

## Testing

- [ ] Homepage loads: `https://yourdomain.com`
- [ ] API works: `https://yourdomain.com/api/news/list`
- [ ] Admin login: `https://yourdomain.com/login`
- [ ] Can create content
- [ ] Images upload successfully
- [ ] All pages load correctly
- [ ] No console errors
- [ ] No PHP errors

## Security

- [ ] HTTPS is working
- [ ] Admin password is secure
- [ ] File permissions are correct
- [ ] `.htaccess` is in place
- [ ] Error display is OFF
- [ ] Database credentials are secure

## Final Verification

- [ ] All sections display correctly
- [ ] Mobile responsive works
- [ ] All links work
- [ ] Forms submit correctly
- [ ] Images display properly
- [ ] Navigation works

---

**Deployment Complete!** ✅

