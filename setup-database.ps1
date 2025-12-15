# PostgreSQL Setup Script
# This script creates the database for AI Interview App

$pgPath = "C:\Program Files\PostgreSQL\18\bin"
$env:Path += ";$pgPath"

Write-Host "🔍 Testing PostgreSQL connection..." -ForegroundColor Cyan

# Test psql
& "$pgPath\psql.exe" --version

Write-Host "`n📝 Creating database 'ai_interview_db'..." -ForegroundColor Cyan
Write-Host "Please enter your PostgreSQL password when prompted.`n" -ForegroundColor Yellow

# Create database
$createDbCommand = "CREATE DATABASE ai_interview_db;"
& "$pgPath\psql.exe" -U postgres -c $createDbCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Database 'ai_interview_db' created successfully!" -ForegroundColor Green
    
    Write-Host "`n📋 Listing all databases:" -ForegroundColor Cyan
    & "$pgPath\psql.exe" -U postgres -c "\l"
    
    Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Update your .env file with:" -ForegroundColor White
    Write-Host '   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_interview_db?schema=public"' -ForegroundColor Yellow
    Write-Host "`n2. Run: npx prisma migrate dev --name initial_setup" -ForegroundColor White
    Write-Host "3. Run: npm run prisma:seed" -ForegroundColor White
} else {
    Write-Host "`n❌ Failed to create database. Please check your password." -ForegroundColor Red
    Write-Host "If the database already exists, you can proceed to the next step." -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
