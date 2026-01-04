# CMD ING Guwahati - Deployment Guide

## Prerequisites

- Shared cPanel hosting with PHP 8+ support
- MySQL database
- FTP/cPanel File Manager access
- Node.js installed locally (for building React app)

## Step 1: Database Setup

1. Log into cPanel and create a new MySQL database
2. Create a database user and grant all privileges
3. Import the database schema:

```bash
# Via phpMyAdmin or MySQL command line
mysql -u your_db_user -p your_database < database/schema.sql
```

4. Update database credentials in `public_html/api/config/database.php`:
   - `DB_HOST`: Usually `localhost`
   - `DB_NAME`: Your database name
   - `DB_USER`: Your database user
   - `DB_PASS`: Your database password

5. **IMPORTANT**: Create an admin user with a secure password:

```sql
-- Generate password hash using PHP:
-- php -r "echo password_hash('YourSecurePassword', PASSWORD_BCRYPT, ['cost' => 12]);"

INSERT INTO admins (username, password_hash, role) 
VALUES ('admin', '$2y$12$YOUR_GENERATED_HASH_HERE', 'admin');
```

## Step 2: Build React Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Build for production:
```bash
npm run build
```

This will create the production build in `../public_html/` directory.

## Step 3: Upload Files to cPanel

### Via FTP/cPanel File Manager:

1. Upload all contents of `public_html/` to your cPanel `public_html/` directory:
   - `index.html` (React build output)
   - `assets/` directory (React build assets)
   - `api/` directory (PHP API)
   - `.htaccess` file

2. **IMPORTANT**: Ensure file permissions:
   - Files: 644
   - Directories: 755
   - `api/` directory: 755
   - `uploads/` directory (create if needed): 755

3. Create uploads directory:
```bash
mkdir public_html/uploads
chmod 755 public_html/uploads
```

## Step 4: Configure .htaccess

The `.htaccess` file is already configured, but verify:
- HTTPS enforcement is working
- React routing is working
- Security headers are set

## Step 5: Security Configuration

1. **Move database credentials** (if possible):
   - If your hosting allows, move `database.php` outside `public_html`
   - Update the path in files that require it

2. **Set environment** in `public_html/api/config/constants.php`:
   ```php
   define('ENVIRONMENT', 'production');
   ```

3. **Verify security settings**:
   - Check that `display_errors` is Off in PHP
   - Verify session security settings
   - Test HTTPS enforcement

## Step 6: Test the Application

1. **Test Public Pages**:
   - Visit your domain
   - Verify all sections load correctly
   - Check API endpoints are accessible

2. **Test Admin Login**:
   - Navigate to `/login`
   - Login with admin credentials
   - Verify dashboard loads

3. **Test CRUD Operations**:
   - Create a test birthday wish
   - Create a test news article
   - Verify all admin functions work

## Step 7: Post-Deployment Security Checklist

- [ ] HTTPS is enforced (check redirect)
- [ ] Database credentials are secure
- [ ] Admin password is changed from default
- [ ] File permissions are correct (644/755)
- [ ] `.htaccess` is in place
- [ ] Error logging is enabled
- [ ] Display errors is OFF in production
- [ ] Session security is working
- [ ] CSRF protection is active
- [ ] Rate limiting is working

## Troubleshooting

### React Routes Not Working
- Verify `.htaccess` is uploaded
- Check Apache mod_rewrite is enabled
- Verify base path in `vite.config.ts`

### API Endpoints Return 404
- Check `public_html/api/index.php` exists
- Verify `.htaccess` allows API access
- Check file permissions

### Database Connection Errors
- Verify credentials in `database.php`
- Check database user has proper permissions
- Verify database exists

### Session Issues
- Check PHP session directory is writable
- Verify session cookies are being set
- Check HTTPS is working (required for secure cookies)

### CORS Errors
- Verify API is on same domain
- Check CORS settings in `api/index.php`

## Maintenance

### Regular Tasks:
1. Monitor error logs
2. Review audit logs in database
3. Update dependencies (React, PHP)
4. Backup database regularly
5. Review security logs

### Backup:
- Database: Export via phpMyAdmin or mysqldump
- Files: Backup `public_html/` directory

## Support

For issues or questions, refer to:
- PHP error logs (cPanel → Error Log)
- Browser console for frontend errors
- Database audit_logs table for admin actions


