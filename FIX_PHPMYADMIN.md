# Fix phpMyAdmin Connection Error

phpMyAdmin is trying to connect with the wrong password. You need to update its configuration.

## Step 1: Find phpMyAdmin Config File

The config file is usually at:
```
C:\xampp\phpMyAdmin\config.inc.php
```

## Step 2: Edit the Config File

Open `C:\xampp\phpMyAdmin\config.inc.php` in a text editor.

## Step 3: Update Password

Look for these lines (usually around line 20-30):

```php
$cfg['Servers'][$i]['user'] = 'root';
$cfg['Servers'][$i]['password'] = '';
```

Change the password to:

```php
$cfg['Servers'][$i]['user'] = 'root';
$cfg['Servers'][$i]['password'] = 'john@1991js';
```

## Step 4: Fix Control User (if exists)

If you see lines about 'pma' user (control user), you can either:

**Option A: Comment them out (simpler):**
```php
// $cfg['Servers'][$i]['controluser'] = 'pma';
// $cfg['Servers'][$i]['controlpass'] = '';
```

**Option B: Or create the pma user in MySQL:**
```sql
CREATE USER 'pma'@'localhost' IDENTIFIED BY '';
GRANT USAGE ON *.* TO 'pma'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `phpmyadmin`.* TO 'pma'@'localhost';
FLUSH PRIVILEGES;
```

## Step 5: Save and Refresh

1. Save the config file
2. Refresh phpMyAdmin in your browser
3. Try logging in with:
   - Username: `root`
   - Password: `john@1991js`

## Alternative: Use Command Line Instead

If phpMyAdmin is too complicated, you can just use the command line:

```cmd
cd C:\xampp\mysql\bin
.\mysql -u root -p cmd_ing_guwahati
```

This works perfectly fine for database management!

