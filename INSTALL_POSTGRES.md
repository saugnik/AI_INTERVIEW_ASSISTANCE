# Quick PostgreSQL Setup for Windows

## Download and Install (5 minutes)

### Step 1: Download
1. Open this link: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Download **PostgreSQL 16.6** for Windows x86-64
3. Run the downloaded `.exe` file

### Step 2: Installation Wizard
Follow these settings:

| Setting | Value |
|---------|-------|
| Installation Directory | `C:\Program Files\PostgreSQL\16` (default) |
| Components | ✓ PostgreSQL Server<br>✓ pgAdmin 4<br>✓ Command Line Tools |
| Data Directory | `C:\Program Files\PostgreSQL\16\data` (default) |
| **Password** | `2004` ⚠️ IMPORTANT |
| Port | `5432` (default) |
| Locale | Default locale |

Click "Next" through all screens and "Finish" when done.

### Step 3: Verify Installation

Open PowerShell and run:
```powershell
# Check if service is running
Get-Service postgresql-x64-16

# Should show: Status = Running
```

### Step 4: Create Database

Run this command in PowerShell:
```powershell
# Set password environment variable
$env:PGPASSWORD="2004"

# Create database
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE ai_interview_db;"

# Verify database was created
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "\l"
```

### Step 5: Add to PATH (Optional but Recommended)

```powershell
# Add PostgreSQL bin to PATH
$pgPath = "C:\Program Files\PostgreSQL\16\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$pgPath", "User")
```

**Close and reopen your terminal after this step.**

### Step 6: Run Prisma Migrations

```bash
# In your project directory
cd c:\Users\LENOVO\OneDrive\Desktop\AI_INTERVIEW_APP

# Generate Prisma client
npx prisma generate

# Run migrations to create all tables
npx prisma migrate dev --name init

# Open Prisma Studio to view your database
npx prisma studio
```

## Verification

Test the connection:
```bash
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✓ Connected!')).catch(e => console.error('✗ Failed:', e.message));"
```

## Troubleshooting

### "psql: command not found"
- PostgreSQL bin folder not in PATH
- Solution: Use full path `C:\Program Files\PostgreSQL\16\bin\psql.exe`

### "password authentication failed"
- Wrong password or user
- Solution: Reinstall with password `2004`

### "database already exists"
- Database was already created
- Solution: This is fine, continue to next step

### Service not running
```powershell
Start-Service postgresql-x64-16
```

## What's Next?

After PostgreSQL is installed and database is created:
1. ✅ Run Prisma migrations (creates all tables)
2. ✅ Test API endpoints
3. ✅ Verify data persistence
