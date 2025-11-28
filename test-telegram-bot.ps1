# Скрипт для проверки работы Telegram бота через терминал

$BOT_TOKEN = "8581479820:AAExSOxUrhpGMecalu9DwmdCkoL_RZANxT8"
$BASE_URL = "https://api.telegram.org/bot$BOT_TOKEN"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Проверка Telegram бота" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Проверка информации о боте
Write-Host "1. Проверка информации о боте (getMe)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/getMe" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.ok) {
        Write-Host "✓ Бот работает!" -ForegroundColor Green
        Write-Host "  ID: $($data.result.id)" -ForegroundColor Gray
        Write-Host "  Имя: $($data.result.first_name)" -ForegroundColor Gray
        Write-Host "  Username: @$($data.result.username)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Ошибка: $($data.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Ошибка подключения: $_" -ForegroundColor Red
}
Write-Host ""

# 2. Проверка зарегистрированных команд
Write-Host "2. Проверка зарегистрированных команд (getMyCommands)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/getMyCommands" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    if ($data.ok) {
        Write-Host "✓ Команды зарегистрированы!" -ForegroundColor Green
        foreach ($cmd in $data.result) {
            Write-Host "  /$($cmd.command) - $($cmd.description)" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Ошибка: $($data.description)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Ошибка подключения: $_" -ForegroundColor Red
}
Write-Host ""

# 3. Проверка API сервера (если запущен локально)
Write-Host "3. Проверка API сервера (localhost:3000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/server/ping" -UseBasicParsing -TimeoutSec 2
    Write-Host "✓ Сервер работает!" -ForegroundColor Green
    Write-Host "  Ответ: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "⚠ Сервер не запущен локально (это нормально, если вы используете Render.com)" -ForegroundColor Yellow
}
Write-Host ""

# 4. Проверка API авторизации (если сервер запущен)
Write-Host "4. Проверка API авторизации..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/telegram/bot/user-info?telegramId=123456789" -UseBasicParsing -TimeoutSec 2
    $data = $response.Content | ConvertFrom-Json
    if ($data.user) {
        Write-Host "✓ API авторизации работает!" -ForegroundColor Green
    } else {
        Write-Host "  Пользователь не найден (это нормально, если не авторизован)" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  Пользователь не найден (это нормально)" -ForegroundColor Gray
    } else {
        Write-Host "⚠ API недоступен (сервер не запущен или недоступен)" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Проверка завершена!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Для проверки работы бота:" -ForegroundColor Yellow
Write-Host "1. Откройте Telegram" -ForegroundColor White
Write-Host "2. Найдите вашего бота" -ForegroundColor White
Write-Host "3. Отправьте команду /start" -ForegroundColor White
Write-Host "4. Отправьте команду /me" -ForegroundColor White
Write-Host ""

