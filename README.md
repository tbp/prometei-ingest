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

**Webhook URL:** `https://your-domain.com/api/inngest`

## 🌐 Настройка webhook в amoCRM

1. Войдите в настройки amoCRM
2. Добавьте webhook: `https://your-domain.com/api/inngest`

## 🔐 Переменные окружения

```bash
CRM_API_URL=https://your-crm-api.com/endpoint
CRM_API_KEY=your_api_key
CRM_API_USERNAME=your_username
CRM_API_PASSWORD=your_password
```
