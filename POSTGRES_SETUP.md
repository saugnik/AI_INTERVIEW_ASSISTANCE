# PostgreSQL Installation and Setup Guide for Windows

## Step 1: Download PostgreSQL

I'll help you install PostgreSQL using Chocolatey (Windows package manager) or manual download.

### Option A: Using Chocolatey (Recommended - Faster)

```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install PostgreSQL
choco install postgresql16 -y --params '/Password:2004'
```

### Option B: Manual Installation

1. Download PostgreSQL 16 from: https://www.postgresql.org/download/windows/
2. Run the installer (postgresql-16.x-windows-x64.exe)
3. Follow installation wizard:
   - Installation Directory: `C:\Program Files\PostgreSQL\16`
   - Data Directory: `C:\Program Files\PostgreSQL\16\data`
   - Password: `2004` (as specified in your .env)
   - Port: `5432`
   - Locale: Default
4. Complete installation

## Step 2: Verify Installation

```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Test psql command
psql --version
```

## Step 3: Create Database

```powershell
# Connect to PostgreSQL as postgres user
# Password: 2004
psql -U postgres

# In psql prompt, run:
CREATE DATABASE ai_interview_db;
\l  # List databases to verify
\q  # Quit
```

## Step 4: Configure Environment

Your `.env` file already has the correct connection string:
```
DATABASE_URL="postgresql://postgres:2004@localhost:5432/ai_interview_db?schema=public"
```

## Step 5: Run Prisma Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Open Prisma Studio to view database
npx prisma studio
```

## Troubleshooting

### Service Not Starting
```powershell
# Start PostgreSQL service manually
Start-Service postgresql-x64-16

# Set to start automatically
Set-Service postgresql-x64-16 -StartupType Automatic
```

### Connection Issues
```powershell
# Check if PostgreSQL is listening on port 5432
netstat -ano | findstr :5432

# Check pg_hba.conf for authentication settings
# Location: C:\Program Files\PostgreSQL\16\data\pg_hba.conf
```

### Password Authentication Failed
Edit `pg_hba.conf` and ensure this line exists:
```
host    all             all             127.0.0.1/32            md5
```

Then restart PostgreSQL service.

## Next Steps

After installation:
1. Run the setup script: `node setup-database.js`
2. Run API tests: `node test-api.js`
3. Run database tests: `node test-database.js`
