import { inngest } from "../../client";

/**
 * Task 4: Создание задачи в ERP системе
 * Создает задачу в ERP с данными из amoCRM
 */
export const createErpTask = inngest.createFunction(
  { id: "erp-create-task", retries: 3 },
  { event: "erp/task.create" },
  async ({ event }) => {
    const { ERP_API_URL, ERP_API_KEY, ERP_API_USERNAME, ERP_API_PASSWORD } = process.env;

    if (!ERP_API_URL || !ERP_API_KEY || !ERP_API_USERNAME || !ERP_API_PASSWORD) {
      throw new Error("Missing ERP environment variables");
    }

    const { leadName, leadPrice, leadId } = event.data;

    console.log(`🏢 Creating ERP task for lead: ${leadName} (ID: ${leadId})`);

    const response = await fetch(ERP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: ERP_API_KEY,
        username: ERP_API_USERNAME,
        password: ERP_API_PASSWORD,
        action: "insert",
        entity_id: 70,
        items: {
          field_1039: leadName, // Название сделки
          ...(leadPrice && { field_1040: leadPrice }), // Сумма сделки
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ERP API error ${response.status}: ${error}`);
    }

    const erpResult = await response.json();
    
    console.log(`✅ ERP task created successfully:`, erpResult);

    // Запускаем финализацию pipeline
    await inngest.send({
      name: "pipeline/integration.complete",
      data: {
        ...event.data,
        erpResult,
        erpTaskId: erpResult.data?.id,
        completedAt: new Date().toISOString()
      }
    });

    return {
      success: true,
      erpTaskId: erpResult.data?.id,
      erpResponse: erpResult
    };
  }
);
