# Import Schema Files in PowerShell

PowerShell doesn't support the `<` redirection operator. Use one of these methods:

## Method 1: Pipe Content (Recommended)

```powershell
cd E:\Projects\ing26
Get-Content database\schema.sql | C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati
```

When prompted, enter password: `john@1991js`

Then import updates:
```powershell
Get-Content database\schema_updates.sql | C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati
```

Enter password: `john@1991js` again

## Method 2: Use SOURCE Command

```cmd
cd C:\xampp\mysql\bin
.\mysql.exe -u root -p cmd_ing_guwahati
```

Enter password: `john@1991js`

Then run:
```sql
source E:\Projects\ing26\database\schema.sql;
source E:\Projects\ing26\database\schema_updates.sql;
EXIT;
```

## Method 3: Use CMD

```powershell
cd E:\Projects\ing26
cmd /c "C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati < database\schema.sql"
```

Enter password: `john@1991js`

Then:
```powershell
cmd /c "C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati < database\schema_updates.sql"
```

Enter password: `john@1991js` again

## Method 4: Use phpMyAdmin

1. Open phpMyAdmin in browser
2. Select `cmd_ing_guwahati` database
3. Click "Import" tab
4. Choose file: `database\schema.sql`
5. Click "Go"
6. Repeat for `database\schema_updates.sql`

## Quick Copy-Paste Commands

**For schema.sql:**
```powershell
Get-Content database\schema.sql | C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati
```

**For schema_updates.sql:**
```powershell
Get-Content database\schema_updates.sql | C:\xampp\mysql\bin\mysql.exe -u root -p cmd_ing_guwahati
```

Enter password `john@1991js` when prompted for each.

