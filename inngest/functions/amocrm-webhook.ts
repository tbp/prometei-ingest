import { inngest } from "../client";

type AmoCrmWebhookPayload = {
  originalData: any;
  entity: string;
  action: string;
  leadData: {
    id: number;
    name: string;
    price: number;
    account_id: number;
    pipeline_id: number;
    status_id: number;
    old_pipeline_id?: number;
    old_status_id?: number;
    responsible_user_id: number;
    created_at: number;
    updated_at: number;
  };
  parsedData: {
    subdomain: string;
    leadId: number;
    accountId: number;
    leadName: string;
    leadPrice: number;
    pipelineId: number;
    statusId: number;
    oldPipelineId?: number;
    oldStatusId?: number;
    responsibleUserId: number;
    createdAt: number;
    updatedAt: number;
  };
  receivedAt: string;
  userAgent?: string;
  ip?: string;
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
      // Используем уже обработанные данные из webhook endpoint
      const parsedData = webhookData.parsedData;
      const leadData = webhookData.leadData;
      
      if (!parsedData?.leadId) {
        throw new Error("Lead ID not found in webhook data");
      }

      console.log("📋 Processing webhook data:", {
        entity: webhookData.entity,
        action: webhookData.action,
        leadId: parsedData.leadId,
        leadName: parsedData.leadName
      });

      return {
        leadId: parsedData.leadId,
        accountId: parsedData.accountId,
        subdomain: parsedData.subdomain,
        leadName: parsedData.leadName,
        leadPrice: parsedData.leadPrice,
        pipelineId: parsedData.pipelineId,
        statusId: parsedData.statusId,
        oldPipelineId: parsedData.oldPipelineId,
        oldStatusId: parsedData.oldStatusId,
        responsibleUserId: parsedData.responsibleUserId,
        entity: webhookData.entity,
        action: webhookData.action,
        webhookId: `webhook-${Date.now()}`,
        timestamp: Date.now(),
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
      // Используем поддомен из webhook данных
      const subdomain = webhookData.parsedData?.subdomain || parsed.subdomain;

      if (!subdomain) {
        throw new Error("Missing subdomain in webhook data");
      }

      console.log(`📥 Fetching lead data for ID: ${parsed.leadId} from ${subdomain}`);

      const response = await fetch(`https://${subdomain}.amocrm.ru/api/v4/leads/${parsed.leadId}`, {
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
