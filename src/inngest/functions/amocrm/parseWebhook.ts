import { inngest } from "../../client";

type AmoCrmWebhookPayload = {
  data: {
    "account[id]": string[];
    "account[subdomain]": string[];
    "leads[status][0][id]": string[];
    "leads[status][0][old_pipeline_id]": string[];
    "leads[status][0][old_status_id]": string[];
    "leads[status][0][pipeline_id]": string[];
    "leads[status][0][status_id]": string[];
  };
  id: string;
  name: string;
  ts: number;
  v: null;
};

/**
 * Task 1: Парсинг webhook от amoCRM
 * Извлекает все доступные данные из webhook
 */
export const parseAmoCrmWebhook = inngest.createFunction(
  { id: "amocrm-parse-webhook" },
  { event: "amocrm/webhook.received" },
  async ({ event }) => {
    const webhookData = event.data as AmoCrmWebhookPayload;
    
    // Извлекаем все доступные переменные
    const parsed = {
      // Основные данные
      leadId: webhookData.data["leads[status][0][id]"]?.[0],
      accountId: webhookData.data["account[id]"]?.[0],
      subdomain: webhookData.data["account[subdomain]"]?.[0],
      
      // Pipeline данные
      pipelineId: webhookData.data["leads[status][0][pipeline_id]"]?.[0],
      statusId: webhookData.data["leads[status][0][status_id]"]?.[0],
      oldPipelineId: webhookData.data["leads[status][0][old_pipeline_id]"]?.[0],
      oldStatusId: webhookData.data["leads[status][0][old_status_id]"]?.[0],
      
      // Метаданные webhook
      webhookId: webhookData.id,
      webhookName: webhookData.name,
      timestamp: webhookData.ts,
      
      // Флаги изменений
      pipelineChanged: webhookData.data["leads[status][0][pipeline_id]"]?.[0] !== 
                      webhookData.data["leads[status][0][old_pipeline_id]"]?.[0],
      statusChanged: webhookData.data["leads[status][0][status_id]"]?.[0] !== 
                    webhookData.data["leads[status][0][old_status_id]"]?.[0]
    };

    if (!parsed.leadId) {
      throw new Error("Lead ID not found in webhook data");
    }

    console.log("📥 Webhook parsed:", parsed);

    // Запускаем следующий task в pipeline
    await inngest.send({
      name: "amocrm/auth.required",
      data: parsed
    });

    return parsed;
  }
);
