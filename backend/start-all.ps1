# Start all backend services in parallel
Write-Host "Starting Backend Services..." -ForegroundColor Green

# Start API Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

# Wait 2 seconds for API to initialize
Start-Sleep -Seconds 2

# Start Matching Worker
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run worker:dev"

# Start Parsing Worker
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run worker:parse"

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "  - API Server: http://localhost:5000" -ForegroundColor Cyan
Write-Host "  - Matching Worker: Processing match queue" -ForegroundColor Cyan
Write-Host "  - Parsing Worker: Processing parse queue" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C in each terminal to stop services" -ForegroundColor Yellow

