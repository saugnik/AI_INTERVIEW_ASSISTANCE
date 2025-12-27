# Update DATABASE_URL in .env file
$envFile = "c:\Users\LENOVO\OneDrive\Desktop\AI_INTERVIEW_APP\.env"
$newDatabaseUrl = "postgresql://neondb_owner:npg_PyNZL7ERXSB9@ep-empty-tooth-ad4im0k8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Read the file
$content = Get-Content $envFile -Raw

# Replace the DATABASE_URL line
$content = $content -replace 'DATABASE_URL=.*', "DATABASE_URL=$newDatabaseUrl"

# Write back to file
Set-Content $envFile -Value $content -NoNewline

Write-Host "✅ Updated DATABASE_URL in .env file"
Write-Host "New connection: Neon PostgreSQL (Cloud)"
