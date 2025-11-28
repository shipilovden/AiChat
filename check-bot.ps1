# Telegram Bot Check Script
$token = "8581479820:AAExSOxUrhpGMecalu9DwmdCkoL_RZANxT8"
$serverUrl = "https://aichat-y90j.onrender.com"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Telegram Bot Status Check" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Checking bot connection to Telegram API..." -ForegroundColor Yellow
$botInfo = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getMe"
Write-Host "   Bot: $($botInfo.result.first_name) (@$($botInfo.result.username))" -ForegroundColor Green
Write-Host "   ID: $($botInfo.result.id)" -ForegroundColor Green
Write-Host ""

Write-Host "2. Checking registered commands..." -ForegroundColor Yellow
$commands = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getMyCommands"
if ($commands.result.Count -eq 0) {
    Write-Host "   No commands registered (empty)" -ForegroundColor Red
} else {
    Write-Host "   Found commands: $($commands.result.Count)" -ForegroundColor Green
    foreach ($cmd in $commands.result) {
        Write-Host "   - /$($cmd.command): $($cmd.description)" -ForegroundColor Cyan
    }
}
Write-Host ""

Write-Host "3. Checking server API (ping)..." -ForegroundColor Yellow
try {
    $ping = Invoke-RestMethod -Uri "$serverUrl/api/server/ping" -TimeoutSec 10
    Write-Host "   Server is running: $($ping.pong)" -ForegroundColor Green
} catch {
    Write-Host "   Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "4. Auth API endpoint:" -ForegroundColor Yellow
Write-Host "   $serverUrl/api/auth/telegram/bot/user-info?telegramId=YOUR_ID" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Check completed" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
