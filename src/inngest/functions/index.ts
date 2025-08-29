// amoCRM Tasks
export { parseAmoCrmWebhook } from "./amocrm/parseWebhook";
export { authenticateAmoCrm } from "./amocrm/authenticate";
export { fetchAmoCrmLead } from "./amocrm/fetchLead";

// ERP Tasks
export { createErpTask } from "./erp/createTask";

// Pipeline Tasks
export { handleAmoCrmWebhook } from "./pipeline/webhook";
export { completeIntegrationPipeline } from "./pipeline/complete";

// Legacy task for direct usage (optional)
import { inngest } from "../client";

export const createCrmDeal = inngest.createFunction(
  { id: "create-crm-deal", retries: 3 },
  { event: "crm/create-deal" },
  async ({ event }) => {
    // Запускаем ERP task напрямую для обратной совместимости
    await inngest.send({
      name: "erp/task.create",
      data: {
        leadName: event.data.dealName,
        leadPrice: event.data.amount,
        leadId: `manual-${Date.now()}`
      }
    });

    return { success: true, triggered: "erp/task.create" };
  }
);
