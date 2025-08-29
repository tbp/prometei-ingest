import { inngest } from "../client";

type CreateCrmDealPayload = {
  dealName: string;
  entityId?: number;
  amount?: number;
};

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

type AmoCrmTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
};

type AmoCrmLead = {
  id: number;
  name: string;
  price: number;
  responsible_user_id: number;
  group_id: number;
  status_id: number;
  pipeline_id: number;
  created_by: number;
  updated_by: number;
  created_at: number;
  updated_at: number;
  closest_task_at: number | null;
  is_deleted: boolean;
  custom_fields_values: any[] | null;
  score: number | null;
  account_id: number;
  labor_cost: number | null;
};

/**
 * Получение access token для amoCRM API
 */
async function getAmoCrmAccessToken(): Promise<string> {
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

  const tokenData: AmoCrmTokenResponse = await response.json();
  return tokenData.access_token;
}

/**
 * Получение данных сделки из amoCRM по ID
 */
async function getAmoCrmLead(leadId: string): Promise<AmoCrmLead> {
  const accessToken = await getAmoCrmAccessToken();
  const { AMOCRM_SUBDOMAIN } = process.env;

  const response = await fetch(`https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/${leadId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`amoCRM API error ${response.status}: ${error}`);
  }

  const leadData: AmoCrmLead = await response.json();
  return leadData;
}

/**
 * Создание задачи в ERP системе
 */
async function executeCreateCrmDeal(payload: CreateCrmDealPayload) {
  const { CRM_API_URL, CRM_API_KEY, CRM_API_USERNAME, CRM_API_PASSWORD } = process.env;

  if (!CRM_API_URL || !CRM_API_KEY || !CRM_API_USERNAME || !CRM_API_PASSWORD) {
    throw new Error("Missing CRM environment variables");
  }

  const response = await fetch(CRM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: CRM_API_KEY,
      username: CRM_API_USERNAME,
      password: CRM_API_PASSWORD,
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
    throw new Error(`CRM API error ${response.status}: ${error}`);
  }

  return response.json();
}

/**
 * Создание сделки в CRM
 */
export const createCrmDeal = inngest.createFunction(
  { id: "create-crm-deal", retries: 3 },
  { event: "crm/create-deal" },
  async ({ event }) => {
    const payload = event.data as CreateCrmDealPayload;
    
    if (!payload.dealName) {
      throw new Error("dealName is required");
    }

    return await executeCreateCrmDeal(payload);
  }
);

/**
 * Обработка webhook от amoCRM
 */
export const handleAmoCrmWebhook = inngest.createFunction(
  { id: "amocrm-webhook", retries: 3 },
  { event: "amocrm/webhook" },
  async ({ event }) => {
    const webhookData = event.data as AmoCrmWebhookPayload;
    
    // Извлекаем ID сделки из webhook данных
    const leadId = webhookData.data["leads[status][0][id]"]?.[0];
    
    if (!leadId) {
      throw new Error("Lead ID not found in webhook data");
    }

    console.log(`📥 Received webhook for lead ID: ${leadId}`);

    // Получаем данные сделки из amoCRM API
    const leadData = await getAmoCrmLead(leadId);
    
    console.log(`📋 Lead data retrieved: ${leadData.name}, price: ${leadData.price}`);

    // Создаем задачу в ERP системе с названием сделки
    const erpResult = await executeCreateCrmDeal({
      dealName: leadData.name,
      amount: leadData.price,
      entityId: 70
    });

    return {
      success: true,
      amoCrmLead: {
        id: leadData.id,
        name: leadData.name,
        price: leadData.price
      },
      erpResult,
      processedAt: new Date().toISOString()
    };
  }
);