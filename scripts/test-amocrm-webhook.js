#!/usr/bin/env node

/**
 * Тестирование amoCRM webhook интеграции
 * Имитирует реальный webhook от amoCRM
 */

require('dotenv').config();

/**
 * Тестирование amoCRM webhook с реальной структурой данных
 */
async function testAmoCrmWebhookIntegration(endpoint = "http://localhost:3000/api/inngest") {
  console.log("🚀 Тестирование amoCRM webhook интеграции...");
  console.log("📡 URL:", endpoint);

  // Реальная структура webhook от amoCRM
  const amoCrmWebhookData = {
    name: "amocrm/webhook",
    data: {
      data: {
        "account[id]": ["32452514"],
        "account[subdomain]": ["oooprometei"],
        "leads[status][0][id]": ["45721053"], // ID сделки для тестирования
        "leads[status][0][old_pipeline_id]": ["9679730"],
        "leads[status][0][old_status_id]": ["77186754"],
        "leads[status][0][pipeline_id]": ["9679730"],
        "leads[status][0][status_id]": ["77186758"]
      },
      id: "01K3V7Q0QYTEM0DMCF9P1SWYTB",
      name: "webhook/request.received",
      ts: Date.now(),
      v: null
    }
  };

  console.log("📤 Отправляем amoCRM webhook:");
  console.log(JSON.stringify(amoCrmWebhookData, null, 2));
  console.log("");

  // Проверяем переменные окружения
  const requiredAmoCrmEnvs = [
    'AMOCRM_CLIENT_ID', 
    'AMOCRM_CLIENT_SECRET', 
    'AMOCRM_REDIRECT_URI', 
    'AMOCRM_REFRESH_TOKEN', 
    'AMOCRM_SUBDOMAIN'
  ];
  
  const requiredErpEnvs = [
    'CRM_API_URL', 
    'CRM_API_KEY', 
    'CRM_API_USERNAME', 
    'CRM_API_PASSWORD'
  ];

  const missingAmoCrmEnvs = requiredAmoCrmEnvs.filter(env => !process.env[env]);
  const missingErpEnvs = requiredErpEnvs.filter(env => !process.env[env]);

  if (missingAmoCrmEnvs.length > 0) {
    console.log("⚠️  Отсутствуют переменные amoCRM:", missingAmoCrmEnvs);
    console.log("🔧 Для полного тестирования добавьте их в .env файл");
  }

  if (missingErpEnvs.length > 0) {
    console.log("⚠️  Отсутствуют переменные ERP:", missingErpEnvs);
    console.log("🔧 Для полного тестирования добавьте их в .env файл");
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'amoCRM-webhook/2.0'
      },
      body: JSON.stringify(amoCrmWebhookData)
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
    console.log("Body:", responseData);

    if (response.ok) {
      console.log("✅ amoCRM webhook успешно обработан!");
      console.log("🔗 Проверьте Inngest Dashboard для деталей выполнения");
      console.log("");
      console.log("📋 Ожидаемый процесс:");
      console.log("1. ✅ Webhook получен");
      console.log("2. 🔄 Авторизация в amoCRM API");
      console.log("3. 📥 Получение данных сделки по ID: 45721053");
      console.log("4. 🚀 Создание задачи в ERP системе");
    } else {
      console.log("❌ Ошибка при обработке webhook");
    }

    return { status: response.status, data: responseData };

  } catch (error) {
    console.error("❌ Ошибка при отправке webhook:", error.message);
    console.log("");
    console.log("💡 Убедитесь что:");
    console.log("1. Сервер запущен: npm run dev");
    console.log("2. Inngest dev сервер запущен: npm run inngest");
    console.log("3. API endpoint доступен:", endpoint);
    console.log("4. Переменные окружения настроены");
    throw error;
  }
}

/**
 * Тестирование с разными ID сделок
 */
async function testDifferentLeadIds(endpoint = "http://localhost:3000/api/inngest") {
  console.log("🧪 Тестирование с разными ID сделок...\n");

  const testLeadIds = ["45721053", "12345678", "87654321"];

  for (const leadId of testLeadIds) {
    console.log(`📋 Тестируем Lead ID: ${leadId}`);
    console.log("-".repeat(40));
    
    const webhookData = {
      name: "amocrm/webhook",
      data: {
        data: {
          "account[id]": ["32452514"],
          "account[subdomain]": ["oooprometei"],
          "leads[status][0][id]": [leadId],
          "leads[status][0][pipeline_id]": ["9679730"],
          "leads[status][0][status_id]": ["77186758"]
        },
        id: `test_${leadId}_${Date.now()}`,
        name: "webhook/request.received",
        ts: Date.now(),
        v: null
      }
    };
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });
      
      console.log(`✅ Lead ID ${leadId}: ${response.status}`);
    } catch (error) {
      console.log(`❌ Lead ID ${leadId}: ${error.message}`);
    }
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n🎉 Все тесты отправлены!");
}

/**
 * CLI интерфейс
 */
async function main() {
  const command = process.argv[2];
  const endpoint = process.argv[3] || "http://localhost:3000/api/inngest";

  try {
    switch (command) {
      case "multiple":
        await testDifferentLeadIds(endpoint);
        break;
      default:
        console.log("📋 Доступные команды:");
        console.log("node scripts/test-amocrm-webhook.js [endpoint]     - основной тест");
        console.log("node scripts/test-amocrm-webhook.js multiple [endpoint] - тест с разными ID");
        console.log("");
        console.log("💡 Примеры:");
        console.log("node scripts/test-amocrm-webhook.js");
        console.log("node scripts/test-amocrm-webhook.js multiple");
        console.log("");
        
        // Запускаем основной тест
        await testAmoCrmWebhookIntegration(endpoint);
    }
  } catch (error) {
    console.error("❌ Ошибка выполнения:", error.message);
    process.exit(1);
  }
}

// Запускаем CLI только если скрипт вызван напрямую
if (require.main === module) {
  main();
}

module.exports = {
  testAmoCrmWebhookIntegration,
  testDifferentLeadIds
};
