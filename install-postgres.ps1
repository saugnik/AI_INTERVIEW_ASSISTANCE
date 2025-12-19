# PostgreSQL Installation Script for Windows
# This script downloads and installs PostgreSQL 16

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL 16 Installation for Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$postgresVersion = "16.6-1"
$installerUrl = "https://get.enterprisedb.com/postgresql/postgresql-$postgresVersion-windows-x64.exe"
$installerPath = "$env:TEMP\postgresql-installer.exe"
$installDir = "C:\Program Files\PostgreSQL\16"
$dataDir = "$installDir\data"
$password = "2004"
$port = "5432"

Write-Host "Step 1: Downloading PostgreSQL $postgresVersion..." -ForegroundColor Yellow
Write-Host "Download URL: $installerUrl" -ForegroundColor Gray

try {
    # Download installer
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "✓ Download complete!" -ForegroundColor Green
    Write-Host "Installer saved to: $installerPath" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download manually from:" -ForegroundColor Yellow
    Write-Host "https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    exit 1
}

Write-Host "Step 2: Installing PostgreSQL..." -ForegroundColor Yellow
Write-Host "This may take a few minutes. Please wait..." -ForegroundColor Gray
Write-Host ""

# Installation parameters
$installArgs = @(
    "--mode", "unattended",
    "--unattendedmodeui", "minimal",
    "--superpassword", $password,
    "--serverport", $port,
    "--prefix", "`"$installDir`"",
    "--datadir", "`"$dataDir`"",
    "--servicename", "postgresql-x64-16",
    "--locale", "English, United States",
    "--enable-components", "server,commandlinetools"
)

try {
    # Run installer
    $process = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✓ PostgreSQL installed successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Installation failed with exit code: $($process.ExitCode)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "✗ Installation error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Configuring PostgreSQL..." -ForegroundColor Yellow

# Add PostgreSQL to PATH
$pgBinPath = "$installDir\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$pgBinPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$pgBinPath", "User")
    Write-Host "✓ Added PostgreSQL to PATH" -ForegroundColor Green
}

# Refresh environment variables for current session
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

Write-Host ""
Write-Host "Step 4: Verifying installation..." -ForegroundColor Yellow

# Wait for service to start
Start-Sleep -Seconds 5

# Check if service is running
$service = Get-Service -Name "postgresql-x64-16" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host "✓ PostgreSQL service is running" -ForegroundColor Green
}
else {
    Write-Host "⚠ PostgreSQL service is not running. Starting it..." -ForegroundColor Yellow
    Start-Service -Name "postgresql-x64-16"
    Start-Sleep -Seconds 3
    Write-Host "✓ PostgreSQL service started" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Creating database..." -ForegroundColor Yellow

# Create database using psql
$env:PGPASSWORD = $password
$createDbCommand = "CREATE DATABASE ai_interview_db;"

try {
    & "$pgBinPath\psql.exe" -U postgres -c $createDbCommand 2>&1 | Out-Null
    Write-Host "✓ Database 'ai_interview_db' created successfully!" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Database might already exist or creation failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PostgreSQL Details:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor Gray
Write-Host "  Port: $port" -ForegroundColor Gray
Write-Host "  Username: postgres" -ForegroundColor Gray
Write-Host "  Password: $password" -ForegroundColor Gray
Write-Host "  Database: ai_interview_db" -ForegroundColor Gray
Write-Host ""
Write-Host "Connection String:" -ForegroundColor Cyan
Write-Host "  postgresql://postgres:$password@localhost:$port/ai_interview_db?schema=public" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Close and reopen your terminal to refresh PATH" -ForegroundColor Gray
Write-Host "  2. Run: npx prisma migrate dev --name init" -ForegroundColor Gray
Write-Host "  3. Run: npx prisma studio (to view database)" -ForegroundColor Gray
Write-Host ""

# Cleanup
Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
