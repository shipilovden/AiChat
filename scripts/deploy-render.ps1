# Скрипт для деплоя на Render через терминал (PowerShell)
# Использование: .\scripts\deploy-render.ps1 [-CommitMessage "сообщение"]

param(
    [string]$CommitMessage = "Deploy to Render"
)

# Цвета для вывода
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Cyan "🚀 Деплой на Render.com"
Write-Output ""

# Проверка что мы в правильной директории
if (-not (Test-Path "render.yaml")) {
    Write-ColorOutput Yellow "⚠️  Файл render.yaml не найден. Убедитесь что вы в корне проекта."
    exit 1
}

# Проверка что git инициализирован
try {
    $null = git rev-parse --git-dir 2>$null
} catch {
    Write-ColorOutput Yellow "⚠️  Git репозиторий не инициализирован."
    exit 1
}

Write-ColorOutput Cyan "📋 Информация о деплое:"
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Output "  Репозиторий: $remoteUrl"
} else {
    Write-Output "  Репозиторий: не настроен"
}
$currentBranch = git branch --show-current
Write-Output "  Ветка: $currentBranch"
Write-Output "  Коммит: $CommitMessage"
Write-Output ""

# Проверка изменений
$status = git status --porcelain
if ($status) {
    Write-ColorOutput Yellow "📝 Обнаружены незакоммиченные изменения:"
    git status --short
    Write-Output ""
    $response = Read-Host "Добавить все изменения и закоммитить? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        git add .
        git commit -m $CommitMessage
        Write-ColorOutput Green "✅ Изменения закоммичены"
    } else {
        Write-ColorOutput Yellow "⚠️  Пропущено. Убедитесь что все изменения закоммичены перед деплоем."
    }
}

# Показываем что будет запушено
Write-ColorOutput Cyan "📤 Коммиты для деплоя:"
$localCommits = git log origin/$currentBranch..HEAD --oneline 2>$null
if ($localCommits) {
    Write-Output $localCommits
} else {
    Write-Output "  (все коммиты уже запушены)"
}
Write-Output ""

# Пуш в GitHub
Write-ColorOutput Cyan "📤 Отправка изменений в GitHub..."

if ($currentBranch -ne "main") {
    Write-ColorOutput Yellow "⚠️  Вы не на ветке main. Текущая ветка: $currentBranch"
    $response = Read-Host "Продолжить пуш в текущую ветку? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Output "Отменено."
        exit 0
    }
}

git push origin $currentBranch

Write-Output ""
Write-ColorOutput Green "✅ Изменения отправлены в GitHub!"
Write-Output ""
Write-ColorOutput Cyan "📋 Следующие шаги:"
Write-Output "  1. Render автоматически обнаружит новый коммит"
Write-Output "  2. Начнется автоматический деплой (займет ~5-10 минут)"
Write-Output "  3. Проверьте статус: https://dashboard.render.com"
Write-Output ""
Write-ColorOutput Cyan "🔍 Полезные команды:"
Write-Output "  • Просмотр логов деплоя: https://dashboard.render.com/web/[service-id]/logs"
Write-Output "  • Проверка статуса: https://dashboard.render.com/web/[service-id]"
Write-Output ""
Write-ColorOutput Green "✨ Деплой инициирован!"

