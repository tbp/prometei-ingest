import { inngest } from "../client";

type CreateErpTaskPayload = {
  dealName: string;
  entityId?: number;
  amount?: number;
};

/**
 * Direct ERP Task Creation Function
 * For manual or API-triggered ERP task creation
 */
export const createErpTask = inngest.createFunction(
  { id: "create-erp-task", retries: 3 },
  { event: "erp/task.create" },
  async ({ event, step }) => {
    const payload = event.data as CreateErpTaskPayload;

    // Validate input
    await step.run("validate-input", async () => {
      if (!payload.dealName) {
        throw new Error("dealName is required");
      }
      return { validated: true };
    });

    // Create task in ERP system
    const erpResult = await step.run("create-erp-task", async () => {
      const { ERP_API_URL, ERP_API_KEY, ERP_API_USERNAME, ERP_API_PASSWORD } = process.env;

      if (!ERP_API_URL || !ERP_API_KEY || !ERP_API_USERNAME || !ERP_API_PASSWORD) {
        throw new Error("Missing ERP environment variables");
      }

      const response = await fetch(ERP_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: ERP_API_KEY,
          username: ERP_API_USERNAME,
          password: ERP_API_PASSWORD,
          action: "insert",
          entity_id: payload.entityId ?? 70,
          items: {
            field_1039: payload.dealName,
            ...(payload.amount && { field_1040: payload.amount }),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ERP API error ${response.status}: ${error}`);
      }

      return await response.json();
    });

    return {
      success: true,
      dealName: payload.dealName,
      amount: payload.amount,
      erpTaskId: erpResult.data?.id,
      erpResult,
      createdAt: new Date().toISOString(),
    };
  }
);
