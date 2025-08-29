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

    // Step 2: Authenticate with amoCRM
    const accessToken = await step.run("authenticate-amocrm", async () => {
      const { AMOCRM_CLIENT_ID, AMOCRM_CLIENT_SECRET, AMOCRM_REDIRECT_URI, AMOCRM_REFRESH_TOKEN, AMOCRM_SUBDOMAIN } = process.env;

      if (!AMOCRM_CLIENT_ID || !AMOCRM_CLIENT_SECRET || !AMOCRM_REDIRECT_URI || !AMOCRM_REFRESH_TOKEN || !AMOCRM_SUBDOMAIN) {
        throw new Error("Missing amoCRM environment variables");
      }

      const response = await fetch(`https://${AMOCRM_SUBDOMAIN}.amocrm.ru/oauth2/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: AMOCRM_CLIENT_ID,
          client_secret: AMOCRM_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: AMOCRM_REFRESH_TOKEN,
          redirect_uri: AMOCRM_REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`amoCRM auth error ${response.status}: ${error}`);
      }

      const tokenData = await response.json();
      return tokenData.access_token;
    });

    // Step 3: Fetch lead data from amoCRM
    const leadData = await step.run("fetch-lead-data", async () => {
      const { AMOCRM_SUBDOMAIN } = process.env;

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

      return await response.json();
    });

    // Step 4: Create task in ERP system
    const erpResult = await step.run("create-erp-task", async () => {
      const { CRM_API_URL, CRM_API_KEY, CRM_API_USERNAME, CRM_API_PASSWORD } = process.env;

      if (!CRM_API_URL || !CRM_API_KEY || !CRM_API_USERNAME || !CRM_API_PASSWORD) {
        throw new Error("Missing ERP environment variables");
      }

      const response = await fetch(CRM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: CRM_API_KEY,
          username: CRM_API_USERNAME,
          password: CRM_API_PASSWORD,
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
