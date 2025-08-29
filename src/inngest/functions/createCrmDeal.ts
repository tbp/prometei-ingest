import { inngest } from "../client";

type CreateCrmDealPayload = {
  dealName: string;
  entityId?: number;
  amount?: number;
};

/**
 * Создание сделки в CRM
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
    const data = event.data;
    const body = data.body || data;
    
    const dealData = {
      dealName: body.name || body.deal_name || `Deal from amoCRM ${Date.now()}`,
      amount: body.price || body.amount,
      entityId: body.entity_id || 70
    };

    return await executeCreateCrmDeal(dealData);
  }
);