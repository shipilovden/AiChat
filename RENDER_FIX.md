# 🔧 Исправление ошибки деплоя на Render

## Проблема

Render использует Dockerfile, который пытается собрать весь monorepo, но падает с ошибкой:
```
error: Cannot find module '../../build-utils' from '/app/packages/core/build.ts'
```

## Решение: Используйте Node вместо Docker

### Вариант 1: Изменить настройки в Render Dashboard (РЕКОМЕНДУЮ)

1. В Render Dashboard откройте ваш сервис
2. Перейдите в **Settings**
3. Найдите секцию **"Build & Deploy"**
4. **ИЗМЕНИТЕ**:
   - **Environment**: `Node` (не Docker!)
   - **Node Version**: `23.x` или `23.3.0`
5. Сохраните изменения
6. Render автоматически перезапустит деплой

### Вариант 2: Удалить Dockerfile из репозитория (временно)

Если Render продолжает определять Docker:

1. Переименуйте Dockerfile:
   ```bash
   git mv metasiberian-agent/Dockerfile metasiberian-agent/Dockerfile.backup
   git commit -m "Temporarily disable Dockerfile for Render"
   git push
   ```
2. Render переопределит проект как Node
3. После деплоя можно вернуть Dockerfile обратно

### Вариант 3: Создать .dockerignore для Render

Создайте файл `.dockerignore` в корне, чтобы Render не использовал Docker:

```
# Игнорировать Dockerfile для Render
Dockerfile
docker-compose.yaml
```

## Правильные настройки для Render (Node)

- **Environment**: `Node`
- **Node Version**: `23.x`
- **Build Command**: `cd metasiberian-agent && bun install && bun run build`
- **Start Command**: `cd metasiberian-agent && bun run start`
- **Root Directory**: `metasiberian-agent`

## После исправления

Render должен:
1. Определить проект как Node.js
2. Использовать bun для установки зависимостей
3. Успешно собрать проект
4. Запустить приложение

