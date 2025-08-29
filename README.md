# 🚀 Prometei Ingest - amoCRM to ERP Pipeline

Event-driven интеграция amoCRM с ERP системой через Inngest для автоматизации бизнес-процессов.

## 📋 Возможности

- ✅ **Webhook от amoCRM** - автоматическая обработка входящих webhooks
- ✅ **Создание задач в ERP** - автоматическая интеграция с ERP системой
- ✅ **Fault tolerance** - автоматические retry при ошибках
- ✅ **TypeScript** - полная типизация

## 🛠 Технологии

- **Inngest** - workflow orchestration
- **TypeScript** - типизированный JavaScript
- **Next.js** - API endpoints
- **Context7** - актуальная документация и best practices

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
3. Webhook URL: `https://prometei-ingest.iq-project.ru/api/inngest`
4. Deploy will auto-trigger on git push

### 5. Тестирование

```bash
npm test
```

## 📁 Структура проекта (согласно официальным гайдам Inngest)

```
prometei-ingest/
├── inngest/                   # Inngest functions (официальная структура)
│   ├── client.ts              # Inngest клиент
│   └── functions/
│       ├── amocrm-webhook.ts      # amoCRM webhook handler с steps
│       ├── create-crm-deal.ts     # Прямое создание задач
│       └── index.ts               # Экспорт всех functions
├── pages/api/
│   └── inngest.ts            # Next.js API endpoint
├── scripts/
│   └── test-local.js         # Тестирование
└── package.json
```

## 🔧 Inngest Functions Architecture

### 📋 **amoCRM → ERP Integration (Single Function with Steps)**

**Entry Point:** `handleAmoCrmWebhook` → `https://prometei-ingest.iq-project.ru/api/amocrm-webhook`

**Function Steps (согласно Inngest best practices):**
1. **`parse-webhook`** - Парсинг URL-encoded данных от amoCRM
2. **`get-amocrm-token`** - Использование JWT токена для amoCRM API
3. **`fetch-lead-data`** - Получение полных данных сделки по ID из amoCRM
4. **`create-erp-task`** - Создание задачи в ERP системе с названием сделки

**Преимущества step-based подхода:**
- ✅ Автоматические retry для каждого step
- ✅ Детальная observability в Inngest Dashboard
- ✅ Возможность replay отдельных steps
- ✅ Лучшая отладка и мониторинг

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
// Прямое создание ERP задачи (без amoCRM)
await inngest.send({
  name: "erp/task.create",
  data: {
    dealName: "Новая ERP задача",
    amount: 15000
  }
});
```

## 🌐 Настройка webhook в amoCRM

1. Войдите в настройки amoCRM
2. Добавьте webhook: `https://prometei-ingest.iq-project.ru/api/amocrm-webhook`



