# AI Interview App - Start All Servers
Write-Host "Starting AI Interview App..." -ForegroundColor Cyan

# Start Main Backend
Write-Host "Starting Main Backend (port 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command cd '$PSScriptRoot'; `$env:PORT=3001; node server.js"

Start-Sleep -Seconds 2

# Start Auth Backend  
Write-Host "Starting Auth Backend (port 3002)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command cd '$PSScriptRoot\AUTH_SYSTEM\backend'; npm start"

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend (port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command cd '$PSScriptRoot'; npm run dev"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "All servers started!" -ForegroundColor Green
Write-Host "Open browser to: http://localhost:5173" -ForegroundColor Cyan
