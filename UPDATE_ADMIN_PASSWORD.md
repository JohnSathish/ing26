# Update Existing Admin User Password

The admin user already exists. You need to UPDATE it instead of INSERT.

## Step 1: Connect to Database

```cmd
cd C:\xampp\mysql\bin
.\mysql -u root -p cmd_ing_guwahati
```

Enter password: `john@1991js`

## Step 2: Check Existing Admin

```sql
SELECT id, username, role FROM admins;
```

## Step 3: Update Password

Update the existing admin user's password:

```sql
UPDATE admins 
SET password_hash='$2y$12$MfTJjaIpjwGY02w04C096uuUv82jHekr3prWvl4roPH3zEhkNxaLW' 
WHERE username='admin';
```

## Step 4: Verify Update

```sql
SELECT username, role FROM admins WHERE username='admin';
```

You should see the admin user.

## Step 5: Exit

```sql
EXIT;
```

## Step 6: Test Login

1. Open browser: `http://localhost:5173/login`
2. Login with:
   - Username: `admin`
   - Password: `admin123`

## Alternative: Delete and Recreate (if needed)

If you want to start fresh:

```sql
DELETE FROM admins WHERE username='admin';
INSERT INTO admins (username, password_hash, role) 
VALUES ('admin', '$2y$12$MfTJjaIpjwGY02w04C096uuUv82jHekr3prWvl4roPH3zEhkNxaLW', 'admin');
```

But UPDATE is simpler and safer!

