#!/usr/bin/env node

/**
 * Тестирование синхронизации с Inngest
 * Проверяет подключение к Inngest API и отправку событий
 */

require('dotenv').config();

async function testInngestSync() {
  console.log("🚀 Тестирование синхронизации с Inngest...");
  
  const endpoint = "https://prometei-ingest.iq-project.ru/api/inngest";
  
  // Тестовое событие для amoCRM webhook
  const testEvent = {
    name: "amocrm/webhook",
    data: {
      data: {
        "account[id]": ["32452514"],
        "account[subdomain]": ["oooprometei"],
        "leads[status][0][id]": ["45721053"],
        "leads[status][0][old_pipeline_id]": ["9679730"],
        "leads[status][0][old_status_id]": ["77186754"],
        "leads[status][0][pipeline_id]": ["9679730"],
        "leads[status][0][status_id]": ["77186758"]
      },
      id: "test_" + Date.now(),
      name: "webhook/request.received",
      ts: Date.now(),
      v: null
    }
  };

  console.log("📡 Отправляем тестовое событие:");
  console.log("URL:", endpoint);
  console.log("Event:", JSON.stringify(testEvent, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Inngest-Test/1.0'
      },
      body: JSON.stringify(testEvent)
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log("📊 Ответ сервера:");
    console.log("Status:", response.status);
    console.log("Response:", responseData);

    if (response.ok) {
      console.log("✅ Синхронизация с Inngest работает!");
      console.log("🔗 Проверьте Inngest Dashboard для деталей выполнения");
      console.log("📋 Dashboard: https://app.inngest.com/");
    } else {
      console.log("❌ Ошибка синхронизации с Inngest");
      console.log("🔧 Проверьте переменные окружения и настройки Inngest");
    }

    return response.ok;

  } catch (error) {
    console.error("❌ Ошибка при тестировании Inngest:", error.message);
    console.log("");
    console.log("💡 Возможные причины:");
    console.log("1. Сервер не запущен или недоступен");
    console.log("2. Неправильные переменные окружения INNGEST_*");
    console.log("3. Проблемы с DNS или сетью");
    console.log("4. Inngest endpoint не зарегистрирован");
    
    return false;
  }
}

/**
 * Тестирование прямого создания ERP задачи
 */
async function testDirectErpTaskCreation() {
  console.log("\n🧪 Тестирование прямого создания ERP задачи...");
  
  const endpoint = "https://prometei-ingest.iq-project.ru/api/inngest";
  
  const testEvent = {
    name: "erp/task.create",
    data: {
      dealName: "Тестовая ERP задача из Inngest",
      amount: 12500,
      entityId: 70
    }
  };

  console.log("📤 Отправляем событие создания ERP задачи:");
  console.log(JSON.stringify(testEvent, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Inngest-Test/1.0'
      },
      body: JSON.stringify(testEvent)
    });

    const responseData = await response.json();

    console.log("📊 Результат:");
    console.log("Status:", response.status);
    console.log("Response:", responseData);

    if (response.ok) {
      console.log("✅ Прямое создание ERP задачи работает!");
    } else {
      console.log("❌ Ошибка при создании ERP задачи");
    }

    return response.ok;

  } catch (error) {
    console.error("❌ Ошибка:", error.message);
    return false;
  }
}

/**
 * Главная функция
 */
async function main() {
  console.log("🔧 Тестирование Inngest интеграции");
  console.log("=" .repeat(50));
  
  const test1 = await testInngestSync();
  const test2 = await testDirectErpTaskCreation();
  
  console.log("\n🎉 Результаты тестирования:");
  console.log("amoCRM Webhook:", test1 ? "✅ PASSED" : "❌ FAILED");
  console.log("Direct ERP Task Creation:", test2 ? "✅ PASSED" : "❌ FAILED");
  
  if (test1 && test2) {
    console.log("\n🚀 Все тесты прошли! Inngest готов к работе.");
    console.log("📋 Настройте webhook в amoCRM на:");
    console.log("   https://prometei-ingest.iq-project.ru/api/amocrm-webhook");
  } else {
    console.log("\n🔧 Некоторые тесты не прошли. Проверьте настройки.");
  }
}

// Запуск тестов
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testInngestSync,
  testDirectErpTaskCreation
};
