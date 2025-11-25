# 📋 Пошаговая настройка Render.com

## На странице "New Web Service" выполните:

### 1. Основные настройки (верхняя часть формы)

- **Name**: `metasiberian-agent` (или оставьте `ElizaOS`)
- **Language**: ⚠️ **ИЗМЕНИТЕ на "Node"** (сейчас "Docker")
- **Branch**: `main` (уже правильно)
- **Region**: выберите ближайший (например, `Frankfurt` для Европы)
- **Root Directory**: ⚠️ **ВАЖНО!** Введите `metasiberian-agent`

### 2. Прокрутите вниз до "Build & Deploy"

- **Build Command**: 
  ```
  cd metasiberian-agent && bun install && bun run build
  ```
  
- **Start Command**: 
  ```
  cd metasiberian-agent && bun run start
  ```

### 3. Environment Variables (переменные окружения)

Нажмите "Add Environment Variable" и добавьте по одной:

1. **Key**: `OPENAI_API_KEY`
   **Value**: `sk-dVAfNONRGf76I6PgCf4236B378E84c7dAcE993476509899d`

2. **Key**: `NODE_ENV`
   **Value**: `production`

3. **Key**: `PORT`
   **Value**: `3000`

4. **Key**: `SERVER_PORT`
   **Value**: `3000`

### 4. Instance Type

- Выберите **"Free"** (не Starter $7/month!)
- На бесплатном плане приложение "засыпает" после 15 минут бездействия

### 5. Деплой

- Нажмите **"Deploy Web Service"**
- Render начнет сборку и деплой (займет ~5-10 минут)

## ✅ После деплоя

Render предоставит URL вида:
`https://metasiberian-agent.onrender.com`

Проверьте:
- API: `https://metasiberian-agent.onrender.com/api/server/ping`
- Web UI: `https://metasiberian-agent.onrender.com`

## ⚠️ Важно!

1. **Language должен быть "Node"**, не "Docker"
2. **Root Directory** обязательно: `metasiberian-agent`
3. **Instance Type** выберите **"Free"**
4. Все переменные окружения должны быть добавлены

