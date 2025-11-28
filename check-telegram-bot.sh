#!/bin/bash

# Скрипт для проверки работы Telegram бота через терминал
# Использование: bash check-telegram-bot.sh

TELEGRAM_BOT_TOKEN="8581479820:AAExSOxUrhpGMecalu9DwmdCkoL_RZANxT8"
SERVER_URL="${RENDER_EXTERNAL_URL:-http://localhost:3000}"

echo "=========================================="
echo "Проверка работы Telegram бота"
echo "=========================================="
echo ""

echo "1. Проверка подключения бота к Telegram API..."
echo "----------------------------------------"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq '.'
echo ""

echo "2. Проверка зарегистрированных команд..."
echo "----------------------------------------"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMyCommands" | jq '.'
echo ""

echo "3. Проверка API сервера (ping)..."
echo "----------------------------------------"
curl -s "${SERVER_URL}/api/server/ping" | jq '.'
echo ""

echo "4. Проверка API авторизации (без параметров - должен вернуть ошибку)..."
echo "----------------------------------------"
curl -s "${SERVER_URL}/api/auth/telegram/bot/user-info" | jq '.'
echo ""

echo "=========================================="
echo "Проверка завершена"
echo "=========================================="
echo ""
echo "Для проверки с вашим Telegram ID:"
echo "curl -s \"${SERVER_URL}/api/auth/telegram/bot/user-info?telegramId=YOUR_TELEGRAM_ID\" | jq '.'"
echo ""

