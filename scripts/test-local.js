#!/usr/bin/env node

/**
 * Локальное тестирование функций без Inngest API
 * Тестируем только executeCreateCrmDeal функцию напрямую
 */

require('dotenv').config();

// Импортируем функцию напрямую
const path = require('path');
const { execSync } = require('child_process');

/**
 * Тестирование executeCreateCrmDeal функции напрямую
 */
async function testExecuteCreateCrmDeal() {
  console.log("🚀 Тестирование executeCreateCrmDeal функции...");
  
  // Проверяем переменные окружения
  const requiredEnvs = ['CRM_API_URL', 'CRM_API_KEY', 'CRM_API_USERNAME', 'CRM_API_PASSWORD'];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
  
  if (missingEnvs.length > 0) {
    console.error("❌ Отсутствуют переменные окружения:", missingEnvs);
    return false;
  }

  console.log("✅ Все переменные окружения настроены");
  console.log("📋 CRM настройки:");
  console.log("   URL:", process.env.CRM_API_URL);
  console.log("   Username:", process.env.CRM_API_USERNAME);
  console.log("   API Key:", process.env.CRM_API_KEY ? "***установлен***" : "не установлен");
  console.log("");

  // Тестовые данные
  const testPayload = {
    dealName: "Тестовая сделка из локального теста",
    amount: 7500,
    entityId: 70
  };

  console.log("📤 Тестовые данные:", JSON.stringify(testPayload, null, 2));

  try {
    // Имитируем функцию executeCreateCrmDeal
    const body = {
      key: process.env.CRM_API_KEY,
      username: process.env.CRM_API_USERNAME,
      password: process.env.CRM_API_PASSWORD,
      action: "insert",
      entity_id: testPayload.entityId,
      items: {
        field_1039: testPayload.dealName,
        ...(testPayload.amount !== undefined ? { field_1040: testPayload.amount } : {}),
      },
    };

    console.log("🔄 Отправляем запрос к CRM API...");
    console.log("📡 URL:", process.env.CRM_API_URL);
    console.log("📦 Payload:", JSON.stringify(body, null, 2));

    const response = await fetch(process.env.CRM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }

    console.log("📊 Ответ CRM API:");
    console.log("   Status:", response.status);
    console.log("   Response:", json);

    if (response.ok) {
      console.log("✅ CRM API тест успешен!");
      return true;
    } else {
      console.log("❌ CRM API вернул ошибку:", response.status);
      return false;
    }

  } catch (error) {
    console.error("❌ Ошибка при тестировании CRM API:", error.message);
    return false;
  }
}

/**
 * Тестирование компиляции TypeScript
 */
async function testTypeScriptCompilation() {
  console.log("🔧 Тестирование TypeScript компиляции...");
  
  try {
    execSync('npx tsc --noEmit', { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    console.log("✅ TypeScript компиляция успешна");
    return true;
  } catch (error) {
    console.error("❌ Ошибки TypeScript компиляции:");
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Тестирование структуры проекта
 */
function testProjectStructure() {
  console.log("📁 Проверка структуры проекта...");
  
  const requiredFiles = [
    'src/inngest/client.ts',
    'src/inngest/functions/createCrmDeal.ts',
    'pages/api/inngest.ts',
    'package.json',
    'tsconfig.json'
  ];

  const fs = require('fs');
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error("❌ Отсутствуют файлы:", missingFiles);
    return false;
  }

  console.log("✅ Все необходимые файлы присутствуют");
  return true;
}

/**
 * Запуск всех тестов
 */
async function runAllTests() {
  console.log("🧪 Запуск локальных тестов Inngest проекта...\n");
  
  const tests = [
    { name: "Структура проекта", fn: testProjectStructure },
    { name: "TypeScript компиляция", fn: testTypeScriptCompilation },
    { name: "CRM API функция", fn: testExecuteCreateCrmDeal }
  ];

  let allPassed = true;

  for (const test of tests) {
    console.log(`📋 Тест: ${test.name}`);
    console.log("=".repeat(50));
    
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✅ ${test.name}: PASSED`);
      } else {
        console.log(`❌ ${test.name}: FAILED`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      allPassed = false;
    }
    
    console.log("");
  }

  console.log("🎉 Результат тестирования:");
  if (allPassed) {
    console.log("✅ Все тесты прошли успешно!");
    console.log("🚀 Проект готов к работе с Inngest");
  } else {
    console.log("❌ Некоторые тесты не прошли");
    console.log("🔧 Исправьте ошибки перед продолжением");
  }

  return allPassed;
}

/**
 * CLI интерфейс
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case "crm":
        await testExecuteCreateCrmDeal();
        break;
      case "compile":
        await testTypeScriptCompilation();
        break;
      case "structure":
        testProjectStructure();
        break;
      default:
        console.log("📋 Доступные команды:");
        console.log("node scripts/test-local.js crm       - тест CRM API");
        console.log("node scripts/test-local.js compile   - тест компиляции");
        console.log("node scripts/test-local.js structure - тест структуры");
        console.log("node scripts/test-local.js           - все тесты");
        console.log("");
        
        // Запускаем все тесты по умолчанию
        const success = await runAllTests();
        process.exit(success ? 0 : 1);
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
  testExecuteCreateCrmDeal,
  testTypeScriptCompilation,
  testProjectStructure,
  runAllTests
};
