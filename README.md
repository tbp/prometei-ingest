# 🚀 Prometei Flow - CRM Integration

Минималистичная система интеграции с CRM на базе Inngest.

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

### 4. Тестирование

```bash
npm test
```

## 📁 Структура проекта

```
prometei-flow/
├── src/inngest/
│   ├── client.ts              # Inngest клиент
│   └── functions/
│       └── createCrmDeal.ts   # CRM функции
├── pages/api/
│   └── inngest.ts            # API endpoint
├── scripts/
│   └── test-local.js         # Тестирование
└── package.json
```

## 🔧 Функции

### 1. `createCrmDeal` - Создание сделки

```typescript
await inngest.send({
  name: "crm/create-deal",
  data: {
    dealName: "Новая сделка",
    amount: 15000,
    entityId: 70
  }
});
```

### 2. `handleAmoCrmWebhook` - Обработка webhook от amoCRM

**Процесс:**
1. Получает webhook от amoCRM с ID сделки
2. Авторизуется в amoCRM API
3. Получает данные сделки (название, сумма)
4. Создает задачу в ERP системе

**Webhook URL:** `https://your-domain.com/api/inngest`

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
