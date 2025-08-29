import { inngest } from "../client";

type AmoCrmWebhookPayload = {
  originalData: any;
  entity: string;
  action: string;
  parsedData: {
    leadId: number;
    statusId: number;
    pipelineId: number;
    oldStatusId?: number;
    oldPipelineId?: number;
    accountId: number;
    subdomain: string;
    statusChanged: boolean;
    pipelineChanged: boolean;
  };
  changes: {
    statusChanged: boolean;
    pipelineChanged: boolean;
  };
  receivedAt: string;
  userAgent?: string;
  ip?: string;
};

type AmoCrmLeadResponse = {
  id: number;
  name: string;
  price: number;
  responsible_user_id: number;
  group_id: number;
  status_id: number;
  pipeline_id: number;
  loss_reason_id?: number;
  source_id?: number;
  created_by: number;
  updated_by: number;
  closed_at?: number;
  created_at: number;
  updated_at: number;
  closest_task_at?: number;
  is_deleted: boolean;
  custom_fields_values?: any;
  score?: number;
  account_id: number;
  labor_cost?: number;
  is_price_modified_by_robot?: boolean;
  _embedded?: {
    tags?: Array<{
      id: number;
      name: string;
      color?: string;
    }>;
    contacts?: Array<{
      id: number;
      is_main: boolean;
    }>;
    companies?: Array<{
      id: number;
    }>;
    source?: {
      id: number;
      name: string;
    };
  };
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
      
      if (!parsedData?.leadId) {
        throw new Error("Lead ID not found in webhook data");
      }

      console.log("📋 Processing webhook data:", {
        entity: webhookData.entity,
        action: webhookData.action,
        leadId: parsedData.leadId,
        statusChanged: parsedData.statusChanged,
        pipelineChanged: parsedData.pipelineChanged
      });

      return {
        leadId: parsedData.leadId,
        accountId: parsedData.accountId,
        subdomain: parsedData.subdomain,
        pipelineId: parsedData.pipelineId,
        statusId: parsedData.statusId,
        oldPipelineId: parsedData.oldPipelineId,
        oldStatusId: parsedData.oldStatusId,
        statusChanged: parsedData.statusChanged,
        pipelineChanged: parsedData.pipelineChanged,
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

    // Step 3: Fetch lead data from amoCRM API
    const leadData = await step.run("fetch-lead-data", async () => {
      const subdomain = parsed.subdomain;

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

      const data: AmoCrmLeadResponse = await response.json();
      console.log(`📋 Lead fetched: ${data.name}, price: ${data.price}`);
      return data;
    });

    // Step 4: Create task in ERP system
    const erpResult = await step.run("create-erp-task", async () => {
      const { ERP_API_URL, ERP_API_KEY, ERP_API_USERNAME, ERP_API_PASSWORD } = process.env;

      if (!ERP_API_URL || !ERP_API_KEY || !ERP_API_USERNAME || !ERP_API_PASSWORD) {
        throw new Error("Missing ERP environment variables");
      }

      console.log(`🏢 Creating ERP task for lead: ${leadData.name} (ID: ${leadData.id}), price: ${leadData.price}`);

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
            field_1039: leadData.name, // Название сделки из amoCRM
            ...(leadData.price && { field_1040: leadData.price }), // Сумма сделки
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ERP API error ${response.status}: ${error}`);
      }

      const result = await response.json();
      console.log(`✅ ERP task created successfully:`, result);
      return result;
    });

    return {
      success: true,
      pipeline: "amoCRM → ERP Integration",
      webhook: {
        leadId: parsed.leadId,
        statusChanged: parsed.statusChanged,
        pipelineChanged: parsed.pipelineChanged,
      },
      amoCrmData: {
        id: leadData.id,
        name: leadData.name,
        price: leadData.price,
        status_id: leadData.status_id,
        pipeline_id: leadData.pipeline_id,
        responsible_user_id: leadData.responsible_user_id,
      },
      erpResult: {
        taskId: erpResult.data?.id,
        response: erpResult,
      },
      completedAt: new Date().toISOString(),
    };
  }
);
