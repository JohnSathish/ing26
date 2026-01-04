# Manual MariaDB Password Reset (Step-by-Step)

## Step 1: Stop MySQL
- Open **XAMPP Control Panel**
- Click **"Stop"** for MySQL service

## Step 2: Start MySQL in Safe Mode
Open **PowerShell** and run:
```powershell
cd C:\xampp\mysql\bin
.\mysqld --skip-grant-tables --console
```
**Keep this window open!** You should see MySQL starting.

## Step 3: Open NEW PowerShell Window
Open a **NEW PowerShell window** (keep safe mode one running) and run:
```powershell
cd C:\xampp\mysql\bin
.\mysql -u root
```
You should see: `MariaDB [(none)]>`

## Step 4: Reset Password
Copy and paste these commands **one at a time**:

```sql
USE mysql;
```

Then try this (for MariaDB 10.4+):
```sql
UPDATE user SET authentication_string=PASSWORD('john@1991js') WHERE User='root' AND Host='localhost';
```

If you get an error about PASSWORD() function, try this instead:
```sql
UPDATE user SET plugin='mysql_native_password', authentication_string=PASSWORD('john@1991js') WHERE User='root' AND Host='localhost';
```

If that still doesn't work, try:
```sql
UPDATE user SET password=PASSWORD('john@1991js') WHERE User='root';
```

Then:
```sql
FLUSH PRIVILEGES;
EXIT;
```

## Step 5: Stop Safe Mode
- Go back to the safe mode window
- Press **Ctrl+C** to stop it

## Step 6: Start MySQL Normally
- Open **XAMPP Control Panel**
- Click **"Start"** for MySQL service

## Step 7: Test Connection
```powershell
cd C:\xampp\mysql\bin
.\mysql -u root -p
```
When prompted, enter: `john@1991js`

If it connects successfully, you're done! ✅

## Step 8: Test API Connection
After MySQL is working, test your API:
```powershell
curl http://127.0.0.1:8000/api/newsline/current
```

You should get a JSON response (even if it's an empty result or error about missing data, that's fine - it means the database connection is working!).

