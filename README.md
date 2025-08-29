# 🚀 Prometei Flow - CRM Integration with Inngest

Система интеграции с CRM на базе Inngest для обработки webhooks от amoCRM и автоматического создания сделок.

## 📋 Возможности

- ✅ **Webhook от amoCRM** - автоматическая обработка входящих webhooks
- ✅ **Создание сделок в CRM** - интеграция с внешней CRM системой
- ✅ **Пакетная обработка** - создание множественных сделок
- ✅ **Fault tolerance** - автоматические retry при ошибках
- ✅ **Мониторинг** - полная observability через Inngest Dashboard
- ✅ **Типизация** - полная поддержка TypeScript

## 🛠 Технологии

- **Inngest** - основная платформа для workflow orchestration
- **TypeScript** - типизированный JavaScript
- **Node.js** - серверная среда выполнения
- **Next.js** - веб-фреймворк (опционально)

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

### 3. Запуск в режиме разработки

```bash
# Терминал 1: Запуск Inngest dev сервера
npm run inngest

# Терминал 2: Запуск приложения (если используете Next.js)
npm run dev
```

### 4. Тестирование

```bash
# Тест создания сделки
npm run test

# Тест webhook
npm run test:webhook

# Все тесты
node scripts/test-inngest.js all
```

## 📁 Структура проекта

```
prometei-flow/
├── src/
│   ├── inngest/
│   │   ├── client.ts              # Inngest клиент
│   │   └── functions/
│   │       └── createCrmDeal.ts   # CRM функции
│   └── api/
│       └── inngest.ts             # API endpoint
├── scripts/
│   ├── test-inngest.js           # Тестирование функций
│   └── test-webhook.js           # Тестирование webhooks
├── inngest.config.ts             # Конфигурация Inngest
└── package.json
```

## 🔧 Функции Inngest

### 1. `createCrmDeal` - Создание сделки в CRM

```typescript
// Отправка события
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

```typescript
// Автоматически обрабатывает webhook от amoCRM
// URL: https://your-domain.com/api/inngest
```

### 3. `batchCreateCrmDeals` - Пакетное создание сделок

```typescript
// Отправка пакета
await inngest.send({
  name: "crm/batch-create-deals", 
  data: {
    deals: [
      { dealName: "Сделка 1", amount: 10000 },
      { dealName: "Сделка 2", amount: 20000 }
    ]
  }
});
```

## 🌐 Настройка webhook в amoCRM

1. Войдите в настройки amoCRM
2. Найдите раздел "Webhooks" или "Интеграции"
3. Добавьте новый webhook:
   - **URL:** `https://your-domain.com/api/inngest`
   - **События:** Выберите нужные события
   - **Метод:** POST

## 📊 Мониторинг

### Inngest Dashboard
- Перейдите на [app.inngest.com](https://app.inngest.com)
- Просматривайте все выполнения функций в реальном времени
- Анализируйте логи и метрики

### Локальная разработка
```bash
# Inngest dev сервер показывает все события
npm run inngest
```

## 🧪 Тестирование

### Основные команды:

```bash
# Создание одной сделки
node scripts/test-inngest.js create "Тест сделка" 15000 70

# Webhook от amoCRM
node scripts/test-inngest.js webhook

# Пакетное создание
node scripts/test-inngest.js batch

# HTTP endpoint
node scripts/test-inngest.js http

# Все тесты
node scripts/test-inngest.js all
```

### Тестирование webhook:

```bash
# Основной webhook тест
node scripts/test-webhook.js

# Разные типы событий
node scripts/test-webhook.js events

# Тест производительности
node scripts/test-webhook.js performance
```

## 🔐 Переменные окружения

| Переменная | Описание | Обязательная |
|------------|----------|--------------|
| `INNGEST_EVENT_KEY` | Ключ для отправки событий | Да |
| `INNGEST_SIGNING_KEY` | Ключ для подписи | Да |
| `CRM_API_URL` | URL CRM API | Да |
| `CRM_API_KEY` | Ключ CRM API | Да |
| `CRM_API_USERNAME` | Логин CRM | Да |
| `CRM_API_PASSWORD` | Пароль CRM | Да |

## 🚀 Деплой

### Vercel (рекомендуется)

```bash
# Установка Vercel CLI
npm i -g vercel

# Деплой
vercel

# Настройка переменных окружения в Vercel Dashboard
```

### Другие платформы
- Railway
- Netlify
- Heroku
- AWS Lambda

## 🔄 Миграция с Trigger.dev

Проект полностью мигрирован с Trigger.dev на Inngest:

- ✅ Удалены все зависимости Trigger.dev
- ✅ Переписаны все функции на Inngest
- ✅ Обновлены тестовые скрипты
- ✅ Добавлена поддержка webhooks

## 📚 Документация

- [Inngest Documentation](https://www.inngest.com/docs)
- [Inngest TypeScript SDK](https://www.inngest.com/docs/sdk/typescript)
- [Webhook Integration Guide](https://www.inngest.com/docs/guides/webhooks)

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи в Inngest Dashboard
2. Убедитесь что все переменные окружения настроены
3. Запустите тесты: `npm run test`
4. Проверьте статус Inngest dev сервера

## 📄 Лицензия

MIT License
