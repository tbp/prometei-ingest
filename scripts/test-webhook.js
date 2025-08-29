#!/usr/bin/env node

/**
 * Скрипт для тестирования webhook endpoint с Inngest
 * Заменяет старые Trigger.dev webhook тесты
 * 
 * Использование:
 * node scripts/test-webhook.js [endpoint]
 */

/**
 * Тестирование amoCRM webhook endpoint
 */
async function testAmoCrmWebhook(endpoint = "http://localhost:3000/api/inngest") {
  console.log("🚀 Тестирование amoCRM webhook endpoint...");
  console.log("📡 URL:", endpoint);

  // Имитируем реальный webhook от amoCRM
  const amoCrmWebhookData = {
    name: "amocrm/webhook",
    data: {
      type: "lead_created",
      body: {
        id: 98765,
        name: "Новая сделка от amoCRM",
        price: 35000,
        entity_id: 70,
        contact_email: "client@example.com",
        contact_phone: "+7 (999) 888-77-66",
        company_name: "ООО Тестовая компания",
        custom_fields: {
          source: "website_form",
          utm_campaign: "summer_promo",
          utm_source: "google"
        },
        created_at: new Date().toISOString()
      },
      headers: {
        "user-agent": "amoCRM-webhook/2.0",
        "content-type": "application/json",
        "x-amocrm-signature": "test_signature"
      },
      timestamp: new Date().toISOString()
    }
  };

  console.log("📤 Отправляем amoCRM webhook:");
  console.log(JSON.stringify(amoCrmWebhookData, null, 2));
  console.log("");

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'amoCRM-webhook-test/1.0'
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
    console.log("Headers:", Object.fromEntries(response.headers.entries()));
    console.log("Body:", responseData);

    if (response.ok) {
      console.log("✅ amoCRM webhook успешно обработан!");
      console.log("🔗 Проверьте Inngest Dashboard для деталей выполнения");
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
    throw error;
  }
}

/**
 * Тестирование различных типов событий amoCRM
 */
async function testDifferentAmoCrmEvents(endpoint = "http://localhost:3000/api/inngest") {
  console.log("🧪 Тестирование различных событий amoCRM...\n");

  const events = [
    {
      name: "Lead Created",
      data: {
        name: "amocrm/webhook",
        data: {
          type: "lead_created",
          body: {
            id: 11111,
            name: "Новый лид",
            price: 10000,
            status: "new"
          }
        }
      }
    },
    {
      name: "Deal Updated", 
      data: {
        name: "amocrm/webhook",
        data: {
          type: "deal_updated",
          body: {
            id: 22222,
            name: "Обновленная сделка",
            price: 50000,
            status: "in_progress"
          }
        }
      }
    },
    {
      name: "Contact Created",
      data: {
        name: "amocrm/webhook", 
        data: {
          type: "contact_created",
          body: {
            id: 33333,
            name: "Новый контакт",
            email: "new-contact@example.com",
            phone: "+7 (999) 777-66-55"
          }
        }
      }
    }
  ];

  for (const event of events) {
    console.log(`📋 Тестируем: ${event.name}`);
    console.log("-".repeat(40));
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.data)
      });
      
      console.log(`✅ ${event.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${event.name}: ${error.message}`);
    }
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n🎉 Все события отправлены!");
}

/**
 * Тестирование производительности webhook
 */
async function testWebhookPerformance(endpoint = "http://localhost:3000/api/inngest", count = 5) {
  console.log(`⚡ Тестирование производительности: ${count} запросов...`);
  
  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < count; i++) {
    const webhookData = {
      name: "amocrm/webhook",
      data: {
        type: "performance_test",
        body: {
          id: 10000 + i,
          name: `Performance Test Deal ${i + 1}`,
          price: 1000 * (i + 1),
          test_index: i
        }
      }
    };

    const promise = fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    }).then(response => ({
      index: i,
      status: response.status,
      ok: response.ok
    }));

    promises.push(promise);
  }

  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successful = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;

    console.log("📊 Результаты производительности:");
    console.log(`⏱️  Время выполнения: ${duration}ms`);
    console.log(`📈 Среднее время на запрос: ${(duration / count).toFixed(2)}ms`);
    console.log(`✅ Успешных: ${successful}/${count}`);
    console.log(`❌ Неудачных: ${failed}/${count}`);
    
    return { duration, successful, failed, results };
  } catch (error) {
    console.error("❌ Ошибка тестирования производительности:", error.message);
    throw error;
  }
}

/**
 * CLI интерфейс
 */
async function main() {
  const command = process.argv[2];
  const endpoint = process.argv[3] || "http://localhost:3000/api/inngest";

  try {
    switch (command) {
      case "events":
        await testDifferentAmoCrmEvents(endpoint);
        break;
      case "performance":
        const count = parseInt(process.argv[4]) || 5;
        await testWebhookPerformance(endpoint, count);
        break;
      default:
        console.log("📋 Доступные команды:");
        console.log("node scripts/test-webhook.js [endpoint]           - основной тест");
        console.log("node scripts/test-webhook.js events [endpoint]    - разные события");
        console.log("node scripts/test-webhook.js performance [endpoint] [count] - тест производительности");
        console.log("");
        console.log("💡 Примеры:");
        console.log("node scripts/test-webhook.js");
        console.log("node scripts/test-webhook.js events");
        console.log("node scripts/test-webhook.js performance http://localhost:3000/api/inngest 10");
        console.log("");
        
        // Запускаем основной тест
        await testAmoCrmWebhook(endpoint);
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
  testAmoCrmWebhook,
  testDifferentAmoCrmEvents,
  testWebhookPerformance
};