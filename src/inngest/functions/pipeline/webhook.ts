import { inngest } from "../../client";

/**
 * Entry Point: Обработчик входящих webhook от amoCRM
 * Запускает pipeline интеграции
 */
export const handleAmoCrmWebhook = inngest.createFunction(
  { id: "webhook-amocrm-handler" },
  { event: "amocrm/webhook" },
  async ({ event }) => {
    console.log("🚀 Starting amoCRM integration pipeline");
    
    // Запускаем первый task в pipeline
    await inngest.send({
      name: "amocrm/webhook.received",
      data: event.data
    });

    return {
      success: true,
      pipelineStarted: true,
      timestamp: new Date().toISOString()
    };
  }
);
