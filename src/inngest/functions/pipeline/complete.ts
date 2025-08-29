import { inngest } from "../../client";

/**
 * Task 5: Финализация pipeline интеграции
 * Собирает результаты всех tasks и логирует итоговый результат
 */
export const completeIntegrationPipeline = inngest.createFunction(
  { id: "pipeline-complete-integration" },
  { event: "pipeline/integration.complete" },
  async ({ event }) => {
    const {
      // Данные из webhook
      webhookId,
      leadId,
      pipelineChanged,
      statusChanged,
      
      // Данные из amoCRM
      leadName,
      leadPrice,
      leadStatusId,
      leadPipelineId,
      
      // Результат ERP
      erpResult,
      erpTaskId,
      completedAt
    } = event.data;

    console.log("🎉 Integration pipeline completed successfully!");

    const integrationSummary = {
      success: true,
      pipeline: "amoCRM → ERP Integration",
      
      // Входные данные
      input: {
        webhookId,
        leadId,
        leadName,
        leadPrice,
        changes: {
          pipelineChanged,
          statusChanged
        }
      },
      
      // Результаты
      output: {
        erpTaskId,
        erpResult
      },
      
      // Метрики
      metrics: {
        completedAt,
        processingTime: Date.now() - (event.data.timestamp || Date.now())
      },
      
      // Статус каждого шага
      steps: {
        webhookParsed: true,
        amoCrmAuthenticated: true,
        leadDataFetched: true,
        erpTaskCreated: !!erpTaskId,
        pipelineCompleted: true
      }
    };

    console.log("📊 Integration Summary:", JSON.stringify(integrationSummary, null, 2));

    // Здесь можно добавить дополнительные действия:
    // - Отправка уведомлений
    // - Обновление статистики
    // - Логирование в аналитику
    // - Webhook обратно в amoCRM (если нужно)

    return integrationSummary;
  }
);
