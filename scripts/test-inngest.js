#!/usr/bin/env node

/**
 * Скрипт для тестирования Inngest функций
 * Заменяет test-crm-request.js для Trigger.dev
 * 
 * Использование:
 * node scripts/test-inngest.js [command] [args...]
 */

const { Inngest } = require("inngest");

// Создаем клиент Inngest для отправки событий
const inngest = new Inngest({ 
  id: "prometei-flow-test",
  name: "Test Client"
});

/**
 * Тестирование создания одной сделки
 */
async function testCreateDeal(dealName = "Test Deal", amount = 5000, entityId = 70) {
  console.log("🚀 Тестирование создания CRM сделки...");
  
  const payload = {
    dealName,
    amount: parseInt(amount),
    entityId: parseInt(entityId)
  };

  console.log("📤 Отправляем данные:", JSON.stringify(payload, null, 2));

  try {
    const result = await inngest.send({
      name: "crm/create-deal",
      data: payload
    });

    console.log("✅ Событие отправлено успешно:", result);
    console.log("🔗 Проверьте Inngest Dashboard для отслеживания выполнения");
    
    return result;
  } catch (error) {
    console.error("❌ Ошибка при отправке события:", error.message);
    throw error;
  }
}

/**
 * Тестирование webhook от amoCRM
 */
async function testAmoCrmWebhook() {
  console.log("🏢 Тестирование amoCRM webhook...");
  
  const webhookPayload = {
    type: "lead_created",
    body: {
      id: 12345,
      name: "Сделка от amoCRM Webhook",
      price: 25000,
      entity_id: 70,
      contact_email: "test@amocrm.com",
      contact_phone: "+7 (999) 123-45-67"
    },
    headers: {
      "user-agent": "amoCRM-webhook/1.0"
    },
    timestamp: new Date().toISOString()
  };

  console.log("📤 Отправляем webhook данные:", JSON.stringify(webhookPayload, null, 2));

  try {
    const result = await inngest.send({
      name: "amocrm/webhook",
      data: webhookPayload
    });

    console.log("✅ Webhook событие отправлено:", result);
    return result;
  } catch (error) {
    console.error("❌ Ошибка при отправке webhook:", error.message);
    throw error;
  }
}

/**
 * Тестирование пакетного создания сделок
 */
async function testBatchCreate() {
  console.log("📦 Тестирование пакетного создания сделок...");
  
  const batchPayload = {
    deals: [
      { dealName: "Пакетная сделка 1", amount: 10000, entityId: 70 },
      { dealName: "Пакетная сделка 2", amount: 15000, entityId: 70 },
      { dealName: "Пакетная сделка 3", amount: 20000, entityId: 70 }
    ]
  };

  console.log("📤 Отправляем пакет сделок:", JSON.stringify(batchPayload, null, 2));

  try {
    const result = await inngest.send({
      name: "crm/batch-create-deals",
      data: batchPayload
    });

    console.log("✅ Пакетное событие отправлено:", result);
    return result;
  } catch (error) {
    console.error("❌ Ошибка при отправке пакета:", error.message);
    throw error;
  }
}

/**
 * Отправка прямого HTTP запроса к Inngest API endpoint
 */
async function testHttpEndpoint(endpoint = "http://localhost:3000/api/inngest") {
  console.log("🌐 Тестирование HTTP endpoint...");
  console.log("📡 URL:", endpoint);

  const testData = {
    name: "crm/create-deal",
    data: {
      dealName: "HTTP Test Deal",
      amount: 7500,
      entityId: 70
    }
  };

  console.log("📤 HTTP запрос:", JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    
    console.log("📊 HTTP ответ:");
    console.log("Status:", response.status);
    console.log("Body:", responseText);

    if (response.ok) {
      console.log("✅ HTTP запрос успешен!");
    } else {
      console.log("❌ HTTP запрос неуспешен");
    }

    return { status: response.status, body: responseText };
  } catch (error) {
    console.error("❌ Ошибка HTTP запроса:", error.message);
    throw error;
  }
}

/**
 * Запуск всех тестов
 */
async function runAllTests() {
  console.log("🧪 Запуск всех тестов Inngest...\n");
  
  const tests = [
    { name: "Create Deal", fn: () => testCreateDeal() },
    { name: "amoCRM Webhook", fn: () => testAmoCrmWebhook() },
    { name: "Batch Create", fn: () => testBatchCreate() },
    { name: "HTTP Endpoint", fn: () => testHttpEndpoint() }
  ];

  for (const test of tests) {
    console.log(`\n📋 Тест: ${test.name}`);
    console.log("=".repeat(50));
    
    try {
      await test.fn();
      console.log(`✅ ${test.name}: PASSED`);
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
    }
    
    // Пауза между тестами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n🎉 Все тесты завершены!");
  console.log("🔗 Проверьте результаты в Inngest Dashboard: https://app.inngest.com");
}

/**
 * CLI интерфейс
 */
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case "create":
        await testCreateDeal(args[0], args[1], args[2]);
        break;
      case "webhook":
        await testAmoCrmWebhook();
        break;
      case "batch":
        await testBatchCreate();
        break;
      case "http":
        await testHttpEndpoint(args[0]);
        break;
      case "all":
        await runAllTests();
        break;
      default:
        console.log("📋 Доступные команды:");
        console.log("node scripts/test-inngest.js create [dealName] [amount] [entityId]");
        console.log("node scripts/test-inngest.js webhook");
        console.log("node scripts/test-inngest.js batch");
        console.log("node scripts/test-inngest.js http [endpoint]");
        console.log("node scripts/test-inngest.js all");
        console.log("");
        console.log("💡 Примеры:");
        console.log('node scripts/test-inngest.js create "Тест сделка" 15000 70');
        console.log("node scripts/test-inngest.js webhook");
        console.log("node scripts/test-inngest.js all");
        
        // Запускаем базовый тест по умолчанию
        await testCreateDeal();
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
  testCreateDeal,
  testAmoCrmWebhook,
  testBatchCreate,
  testHttpEndpoint,
  runAllTests
};
