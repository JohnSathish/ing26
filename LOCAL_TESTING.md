# Local Testing Guide

## Quick Start

### Option 1: Frontend Only (Development Mode)

This is the fastest way to test the frontend UI, but API calls will fail unless you have the backend running.

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`

**Note**: API calls will fail because the backend isn't running. You'll see errors in the browser console, but you can still test the UI components.

### Option 2: Full Stack (Frontend + Backend)

#### Step 1: Set Up Database

1. **Install MySQL** (if not already installed)
   - Download from https://dev.mysql.com/downloads/
   - Or use XAMPP/WAMP which includes MySQL

2. **Create Database**:
```sql
CREATE DATABASE cmd_ing_guwahati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Import Schema**:
```bash
mysql -u root -p cmd_ing_guwahati < database/schema.sql
```

4. **Create Admin User**:
```bash
# Generate password hash
php -r "echo password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);"
```

Then insert into database:
```sql
INSERT INTO admins (username, password_hash, role) 
VALUES ('admin', '$2y$12$YOUR_GENERATED_HASH', 'admin');
```

#### Step 2: Configure PHP Backend

1. **Update Database Credentials** in `public_html/api/config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'cmd_ing_guwahati');
define('DB_USER', 'root');  // or your MySQL username
define('DB_PASS', '');      // or your MySQL password
```

2. **Set Environment** in `public_html/api/config/constants.php`:
```php
define('ENVIRONMENT', 'development'); // Change from 'production'
```

3. **Create Uploads Directory**:
```bash
mkdir public_html/uploads
chmod 755 public_html/uploads  # On Linux/Mac
```

#### Step 3: Start PHP Server

Open a new terminal and run:

```bash
cd public_html
php -S localhost:8000
```

The PHP API will be available at `http://localhost:8000/api/`

#### Step 4: Configure Frontend for Local API

Update `frontend/src/utils/constants.ts`:

```typescript
// For local development, use the PHP server
export const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: 'http://localhost:8000/api/auth/login',
    LOGOUT: 'http://localhost:8000/api/auth/logout',
    CHECK: 'http://localhost:8000/api/auth/check',
  },
  // ... update all other endpoints similarly
};
```

**OR** use a proxy in `frontend/vite.config.ts` (see below).

#### Step 5: Start React Development Server

In another terminal:

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`

## Recommended: Using Vite Proxy (Easier)

Instead of updating all API endpoints, configure Vite to proxy API requests:

1. **Update `frontend/vite.config.ts`**:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: '../public_html',
    emptyOutDir: false,
    assetsDir: 'assets',
  },
})
```

2. **Keep API endpoints as relative paths** in `constants.ts`:
```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    // ... etc
  }
}
```

3. **Start both servers**:
   - Terminal 1: `cd public_html && php -S localhost:8000`
   - Terminal 2: `cd frontend && npm run dev`

Now API calls from `http://localhost:5173` will be proxied to `http://localhost:8000`

## Testing Checklist

### Public Pages
- [ ] Home page loads
- [ ] Header displays correctly
- [ ] Hero banner shows
- [ ] All sections render (Welcome, Provincial Message, etc.)
- [ ] Footer displays

### Authentication
- [ ] Navigate to `/login`
- [ ] Login with admin credentials
- [ ] Redirects to admin dashboard
- [ ] Logout works

### Admin Dashboard
- [ ] Dashboard shows statistics
- [ ] Navigation works
- [ ] All management pages load:
  - Birthday Wishes
  - News
  - Messages
  - Houses
  - Banners

### CRUD Operations
- [ ] Create new birthday wish
- [ ] Edit existing item
- [ ] Delete item
- [ ] List items correctly

## Troubleshooting

### CORS Errors
If you see CORS errors, the PHP server needs to allow the React dev server origin. Update `public_html/api/index.php`:

```php
// For local development only
if (ENVIRONMENT === 'development') {
    header('Access-Control-Allow-Origin: http://localhost:5173');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
}
```

### Database Connection Errors
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `database.php`
- Check database exists: `SHOW DATABASES;`

### Session Issues
- Check PHP session directory is writable
- For local testing, sessions work without HTTPS
- Check browser allows cookies from localhost

### API 404 Errors
- Verify PHP server is running on port 8000
- Check `.htaccess` in `public_html/api/` exists
- Verify file paths in `api/index.php`

## Alternative: Using XAMPP/WAMP

If you prefer using XAMPP or WAMP:

1. **Copy files to htdocs**:
   - Copy `public_html/` contents to `C:\xampp\htdocs\` (or your WAMP directory)

2. **Start Apache and MySQL** from XAMPP/WAMP control panel

3. **Access at**: `http://localhost/`

4. **Update database config** to use `localhost` and your MySQL credentials

5. **Run React dev server** separately on port 5173

## Quick Test Script

Create a simple test file `test-api.php` in `public_html/`:

```php
<?php
require_once 'api/config/database.php';
require_once 'api/config/constants.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "Database connection: OK\n";
    echo "PHP Version: " . phpversion() . "\n";
    echo "PDO Available: " . (extension_loaded('pdo') ? 'Yes' : 'No') . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
```

Run: `php test-api.php` to verify PHP setup.


