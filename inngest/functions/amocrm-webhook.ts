import { inngest } from "../client";

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
 * Entry Point: Обработчик входящих webhook от amoCRM
 * Запускает pipeline интеграции
 */
export const handleAmoCrmWebhook = inngest.createFunction(
  { id: "amocrm-webhook-handler" },
  { event: "amocrm/webhook" },
  async ({ event, step }) => {
    const webhookData = event.data as AmoCrmWebhookPayload;
    
    // Step 1: Parse webhook data
    const parsed = await step.run("parse-webhook", async () => {
      const leadId = webhookData.data["leads[status][0][id]"]?.[0];
      const accountId = webhookData.data["account[id]"]?.[0];
      const subdomain = webhookData.data["account[subdomain]"]?.[0];
      
      if (!leadId) {
        throw new Error("Lead ID not found in webhook data");
      }

      return {
        leadId,
        accountId,
        subdomain,
        pipelineId: webhookData.data["leads[status][0][pipeline_id]"]?.[0],
        statusId: webhookData.data["leads[status][0][status_id]"]?.[0],
        oldPipelineId: webhookData.data["leads[status][0][old_pipeline_id]"]?.[0],
        oldStatusId: webhookData.data["leads[status][0][old_status_id]"]?.[0],
        webhookId: webhookData.id,
        timestamp: webhookData.ts,
      };
    });

    // Step 2: Get amoCRM access token (JWT - долгосрочный)
    const accessToken = await step.run("get-amocrm-token", async () => {
      const { AMOCRM_ACCESS_TOKEN } = process.env;

      if (!AMOCRM_ACCESS_TOKEN) {
        throw new Error("Missing AMOCRM_ACCESS_TOKEN environment variable");
      }

      // JWT токен готов к использованию, проверяем его валидность
      console.log("🔐 Using long-term JWT token for amoCRM");
      return AMOCRM_ACCESS_TOKEN;
    });

    // Step 3: Fetch lead data from amoCRM
    const leadData = await step.run("fetch-lead-data", async () => {
      const { AMOCRM_SUBDOMAIN } = process.env;

      if (!AMOCRM_SUBDOMAIN) {
        throw new Error("Missing AMOCRM_SUBDOMAIN environment variable");
      }

      console.log(`📥 Fetching lead data for ID: ${parsed.leadId} from ${AMOCRM_SUBDOMAIN}`);

      const response = await fetch(`https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/${parsed.leadId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`amoCRM API error ${response.status}: ${error}`);
      }

      const data = await response.json();
      console.log(`📋 Lead fetched: ${data.name}, price: ${data.price}`);
      return data;
    });

    // Step 4: Create task in ERP system
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
          entity_id: 70,
          items: {
            field_1039: leadData.name,
            ...(leadData.price && { field_1040: leadData.price }),
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
      pipeline: "amoCRM → ERP Integration",
      input: {
        webhookId: parsed.webhookId,
        leadId: parsed.leadId,
        leadName: leadData.name,
        leadPrice: leadData.price,
      },
      output: {
        erpTaskId: erpResult.data?.id,
        erpResult,
      },
      completedAt: new Date().toISOString(),
    };
  }
);
