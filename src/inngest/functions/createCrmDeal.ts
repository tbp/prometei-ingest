import { inngest } from "../client";

type CreateCrmDealPayload = {
  dealName: string;
  entityId?: number;
  amount?: number;
};

/**
 * Основная функция для создания сделки в CRM
 * Перенесена из Trigger.dev на Inngest
 */
export async function executeCreateCrmDeal(payload: CreateCrmDealPayload) {
  const apiUrl = process.env.CRM_API_URL;
  const apiKey = process.env.CRM_API_KEY;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPassword = process.env.CRM_API_PASSWORD;

  if (!apiUrl || !apiKey || !apiUsername || !apiPassword) {
    throw new Error("Missing required CRM env vars: CRM_API_URL, CRM_API_KEY, CRM_API_USERNAME, CRM_API_PASSWORD");
  }

  const body = {
    key: apiKey,
    username: apiUsername,
    password: apiPassword,
    action: "insert",
    entity_id: payload.entityId ?? 70,
    items: {
      field_1039: payload.dealName,
      ...(payload.amount !== undefined ? { field_1040: payload.amount } : {}),
    },
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  console.log("CRM response", { status: response.status, data: json });

  if (!response.ok) {
    throw new Error(`CRM API error ${response.status}: ${text}`);
  }

  return json;
}

/**
 * Inngest функция для создания сделки в CRM
 * Заменяет Trigger.dev task
 */
export const createCrmDeal = inngest.createFunction(
  { 
    id: "create-crm-deal",
    name: "Create CRM Deal",
    retries: 3
  },
  { event: "crm/create-deal" },
  async ({ event, step }) => {
    // Шаг 1: Валидация входных данных
    const validatedPayload = await step.run("validate-payload", async () => {
      const payload = event.data as CreateCrmDealPayload;
      
      if (!payload.dealName) {
        throw new Error("dealName is required");
      }

      console.log("✅ Payload validated:", payload);
      return payload;
    });

    // Шаг 2: Создание сделки в CRM
    const crmResult = await step.run("create-crm-deal", async () => {
      console.log("🏢 Creating CRM deal:", validatedPayload);
      
      try {
        const result = await executeCreateCrmDeal(validatedPayload);
        console.log("✅ CRM deal created successfully:", result);
        return result;
      } catch (error) {
        console.error("❌ Failed to create CRM deal:", error);
        throw error;
      }
    });

    // Шаг 3: Пост-обработка (логирование, уведомления)
    const postProcessing = await step.run("post-processing", async () => {
      const result = {
        success: true,
        dealData: validatedPayload,
        crmResponse: crmResult,
        processedAt: new Date().toISOString()
      };

      console.log("📊 Deal creation completed:", result);
      return result;
    });

    return postProcessing;
  }
);

/**
 * Функция для обработки webhook от amoCRM
 * Автоматически создает сделку при получении webhook
 */
export const handleAmoCrmWebhook = inngest.createFunction(
  { 
    id: "amocrm-webhook-handler",
    name: "Handle amoCRM Webhook",
    retries: 3
  },
  { event: "amocrm/webhook" },
  async ({ event, step }) => {
    // Шаг 1: Анализ webhook данных
    const webhookAnalysis = await step.run("analyze-webhook", async () => {
      const data = event.data;
      
      console.log("🔍 amoCRM Webhook received:", {
        timestamp: new Date().toISOString(),
        eventType: data.type || "unknown",
        fullPayload: data
      });

      // Извлекаем данные сделки из различных форматов amoCRM
      const body = data.body || data;
      const dealData = {
        dealName: body.name || body.deal_name || body.title || `Deal from amoCRM ${Date.now()}`,
        amount: body.price || body.amount || body.budget || body.sale,
        entityId: body.entity_id || body.id || 70
      };

      console.log("📊 Extracted deal data:", dealData);
      return dealData;
    });

    // Шаг 2: Создание сделки через существующую функцию
    const dealResult = await step.run("trigger-deal-creation", async () => {
      console.log("🚀 Triggering CRM deal creation:", webhookAnalysis);
      
      // Вызываем функцию создания сделки
      return await executeCreateCrmDeal({
        dealName: webhookAnalysis.dealName,
        amount: webhookAnalysis.amount ? parseInt(webhookAnalysis.amount.toString()) : undefined,
        entityId: webhookAnalysis.entityId ? parseInt(webhookAnalysis.entityId.toString()) : 70
      });
    });

    // Шаг 3: Финальная обработка
    const finalResult = await step.run("finalize-webhook", async () => {
      const result = {
        success: true,
        webhook: {
          processed: true,
          timestamp: new Date().toISOString(),
          source: "amoCRM"
        },
        deal: {
          input: webhookAnalysis,
          result: dealResult
        }
      };

      console.log("✅ amoCRM webhook processed successfully:", result);
      return result;
    });

    return finalResult;
  }
);

/**
 * Функция для пакетного создания сделок
 * Заменяет batchTrigger из Trigger.dev
 */
export const batchCreateCrmDeals = inngest.createFunction(
  { 
    id: "batch-create-crm-deals",
    name: "Batch Create CRM Deals",
    retries: 3
  },
  { event: "crm/batch-create-deals" },
  async ({ event, step }) => {
    const deals = event.data.deals as CreateCrmDealPayload[];
    
    // Валидация пакета
    await step.run("validate-batch", async () => {
      if (!Array.isArray(deals) || deals.length === 0) {
        throw new Error("deals array is required and must not be empty");
      }
      
      console.log(`📦 Processing batch of ${deals.length} deals`);
      return deals.length;
    });

    // Обработка каждой сделки
    const results = await step.run("process-deals", async () => {
      const batchResults = [];
      
      for (let i = 0; i < deals.length; i++) {
        const deal = deals[i];
        console.log(`🔄 Processing deal ${i + 1}/${deals.length}:`, deal);
        
        try {
          const result = await executeCreateCrmDeal(deal);
          batchResults.push({
            index: i,
            deal,
            result,
            success: true
          });
          console.log(`✅ Deal ${i + 1} created successfully`);
        } catch (error) {
          batchResults.push({
            index: i,
            deal,
            error: error instanceof Error ? error.message : String(error),
            success: false
          });
          console.error(`❌ Deal ${i + 1} failed:`, error);
        }
      }
      
      return batchResults;
    });

    // Сводка результатов
    return await step.run("summarize-batch", async () => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      const summary = {
        total: deals.length,
        successful,
        failed,
        results,
        processedAt: new Date().toISOString()
      };
      
      console.log("📊 Batch processing completed:", summary);
      return summary;
    });
  }
);
