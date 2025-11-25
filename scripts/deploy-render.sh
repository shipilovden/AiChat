#!/bin/bash

# Скрипт для деплоя на Render через терминал
# Использование: ./scripts/deploy-render.sh [commit message]

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Деплой на Render.com${NC}"
echo ""

# Проверка что мы в правильной директории
if [ ! -f "render.yaml" ]; then
    echo -e "${YELLOW}⚠️  Файл render.yaml не найден. Убедитесь что вы в корне проекта.${NC}"
    exit 1
fi

# Проверка что git инициализирован
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Git репозиторий не инициализирован.${NC}"
    exit 1
fi

# Получаем сообщение коммита
COMMIT_MESSAGE="${1:-Deploy to Render}"

echo -e "${BLUE}📋 Информация о деплое:${NC}"
echo "  Репозиторий: $(git remote get-url origin 2>/dev/null || echo 'не настроен')"
echo "  Ветка: $(git branch --show-current)"
echo "  Коммит: $COMMIT_MESSAGE"
echo ""

# Проверка изменений
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}📝 Обнаружены незакоммиченные изменения:${NC}"
    git status --short
    echo ""
    read -p "Добавить все изменения и закоммитить? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "$COMMIT_MESSAGE"
        echo -e "${GREEN}✅ Изменения закоммичены${NC}"
    else
        echo -e "${YELLOW}⚠️  Пропущено. Убедитесь что все изменения закоммичены перед деплоем.${NC}"
    fi
fi

# Проверка что есть что пушить
LOCAL_COMMITS=$(git rev-list @{u}..HEAD 2>/dev/null | wc -l || echo "0")
if [ "$LOCAL_COMMITS" -eq "0" ] && [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Нет новых коммитов для деплоя.${NC}"
    echo "  Render автоматически деплоит последний коммит из ветки main."
    echo "  Если вы хотите перезапустить деплой, используйте Render Dashboard."
    exit 0
fi

# Показываем что будет запушено
echo -e "${BLUE}📤 Коммиты для деплоя:${NC}"
git log --oneline origin/main..HEAD 2>/dev/null || echo "  (все коммиты уже запушены)"
echo ""

# Пуш в GitHub
echo -e "${BLUE}📤 Отправка изменений в GitHub...${NC}"
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  Вы не на ветке main. Текущая ветка: $CURRENT_BRANCH${NC}"
    read -p "Продолжить пуш в текущую ветку? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Отменено."
        exit 0
    fi
fi

git push origin "$CURRENT_BRANCH"

echo ""
echo -e "${GREEN}✅ Изменения отправлены в GitHub!${NC}"
echo ""
echo -e "${BLUE}📋 Следующие шаги:${NC}"
echo "  1. Render автоматически обнаружит новый коммит"
echo "  2. Начнется автоматический деплой (займет ~5-10 минут)"
echo "  3. Проверьте статус: https://dashboard.render.com"
echo ""
echo -e "${BLUE}🔍 Полезные команды:${NC}"
echo "  • Просмотр логов деплоя: https://dashboard.render.com/web/[service-id]/logs"
echo "  • Проверка статуса: https://dashboard.render.com/web/[service-id]"
echo ""
echo -e "${GREEN}✨ Деплой инициирован!${NC}"

