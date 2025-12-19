Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Backend OAuth Configuration Check" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$envContent = Get-Content .env

foreach ($line in $envContent) {
    if ($line -match "^GOOGLE_CLIENT_ID=(.+)$") {
        Write-Host "Client ID: " -NoNewline -ForegroundColor Yellow
        Write-Host $matches[1]
    }
    if ($line -match "^GOOGLE_CLIENT_SECRET=(.+)$") {
        Write-Host "Client Secret: " -NoNewline -ForegroundColor Yellow
        Write-Host $matches[1]
    }
    if ($line -match "^GOOGLE_REDIRECT_URI=(.+)$") {
        Write-Host "Redirect URI: " -NoNewline -ForegroundColor Yellow
        Write-Host $matches[1]
    }
    if ($line -match "^FRONTEND_ORIGIN=(.+)$") {
        Write-Host "Frontend Origin: " -NoNewline -ForegroundColor Yellow
        Write-Host $matches[1]
    }
    if ($line -match "^PORT=(.+)$") {
        Write-Host "Port: " -NoNewline -ForegroundColor Yellow
        Write-Host $matches[1]
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
