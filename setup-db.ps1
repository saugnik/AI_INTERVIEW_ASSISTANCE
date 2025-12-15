# Simple Database Setup for AI Interview App

Write-Host "Setting up PostgreSQL database..." -ForegroundColor Cyan

$pgBin = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "`nCreating database 'ai_interview_db'..." -ForegroundColor Yellow
Write-Host "You will be prompted for your PostgreSQL password.`n"

& $pgBin -U postgres -c "CREATE DATABASE ai_interview_db;"

Write-Host "`nDone! Check if database was created:" -ForegroundColor Green
& $pgBin -U postgres -l
