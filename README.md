# 🚀 Prometei Ingest - amoCRM to ERP Pipeline

Event-driven интеграция amoCRM с ERP системой через Inngest для автоматизации бизнес-процессов.

## 📋 Возможности

- ✅ **Webhook от amoCRM** - автоматическая обработка входящих webhooks
- ✅ **Создание сделок в CRM** - простая интеграция с CRM API
- ✅ **Fault tolerance** - автоматические retry при ошибках
- ✅ **TypeScript** - полная типизация

## 🛠 Технологии

- **Inngest** - workflow orchestration
- **TypeScript** - типизированный JavaScript
- **Next.js** - API endpoints

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

### 3. Запуск

```bash
# Запуск приложения
npm run dev

# В другом терминале: Inngest dev сервер
npm run inngest
```

### 4. Деплой на Vercel

```bash
# Установите Vercel CLI (опционально)
npm i -g vercel

# Или используйте веб-интерфейс: https://vercel.com/new
```

**Настройка переменных окружения в Vercel:**
1. Settings → Environment Variables
2. Добавьте все переменные из `.env.example`
3. Webhook URL: `https://your-project.vercel.app/api/inngest`
4. Deploy will auto-trigger on git push

### 5. Тестирование

```bash
npm test
```

## 📁 Структура проекта

```
prometei-ingest/
├── src/inngest/
│   ├── client.ts              # Inngest клиент
│   └── functions/
│       ├── amocrm/            # amoCRM tasks
│       │   ├── parseWebhook.ts    # Парсинг webhook
│       │   ├── authenticate.ts    # OAuth2 авторизация
│       │   └── fetchLead.ts       # Получение данных сделки
│       ├── erp/               # ERP tasks
│       │   └── createTask.ts      # Создание задачи в ERP
│       ├── pipeline/          # Pipeline tasks
│       │   ├── webhook.ts         # Entry point
│       │   └── complete.ts        # Финализация
│       └── index.ts           # Экспорт всех functions
├── pages/api/
│   └── inngest.ts            # API endpoint
├── scripts/
│   └── test-local.js         # Тестирование
└── package.json
```

## 🔧 Pipeline Architecture

### 📋 **amoCRM → ERP Integration Pipeline**

**Entry Point:** `handleAmoCrmWebhook` → `https://your-domain.com/api/inngest`

**Pipeline Flow:**
1. **`parseAmoCrmWebhook`** - Парсинг webhook, извлечение всех переменных
2. **`authenticateAmoCrm`** - OAuth2 авторизация в amoCRM API
3. **`fetchAmoCrmLead`** - Получение полных данных сделки по ID
4. **`createErpTask`** - Создание задачи в ERP системе
5. **`completeIntegrationPipeline`** - Финализация и логирование результатов

### 🔄 **Доступные переменные из webhook:**

```typescript
// Основные данные
leadId: "45721053"
accountId: "32452514" 
subdomain: "oooprometei"

// Pipeline изменения
pipelineId: "9679730"
statusId: "77186758"
oldPipelineId: "9679730"
oldStatusId: "77186754"

// Флаги изменений
pipelineChanged: boolean
statusChanged: boolean

// Метаданные
webhookId: "01K3V7Q0QYTEM0DMCF9P1SWYTB"
timestamp: 1756481946366
```

### 💡 **Legacy Support:**

```typescript
// Прямое создание задачи (без amoCRM)
await inngest.send({
  name: "crm/create-deal",
  data: {
    dealName: "Новая сделка",
    amount: 15000
  }
});
```

## 🌐 Настройка webhook в amoCRM

1. Войдите в настройки amoCRM
2. Добавьте webhook: `https://your-domain.com/api/inngest`

## 🔐 Переменные окружения

```bash
# amoCRM API
AMOCRM_CLIENT_ID=your_amocrm_client_id
AMOCRM_CLIENT_SECRET=your_amocrm_client_secret
AMOCRM_REDIRECT_URI=https://your-domain.com/oauth/callback
AMOCRM_REFRESH_TOKEN=your_refresh_token
AMOCRM_SUBDOMAIN=oooprometei

# ERP System API
CRM_API_URL=https://your-erp-api.com/endpoint
CRM_API_KEY=your_erp_api_key
CRM_API_USERNAME=your_erp_username
CRM_API_PASSWORD=your_erp_password
```
