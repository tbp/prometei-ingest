import { task, logger } from "@trigger.dev/sdk/v3";

type CreateCrmDealPayload = {
  dealName: string;
  entityId?: number;
  amount?: number;
};

export async function executeCreateCrmDeal(payload: CreateCrmDealPayload) {
  const apiUrl = process.env.CRM_API_URL;
  const apiKey = process.env.CRM_API_KEY;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPassword = process.env.CRM_API_PASSWORD;

  if (!apiUrl || !apiKey || !apiUsername || !apiPassword) {
    throw new Error("Missing required CRM env vars: CRM_API_URL, CRM_API_KEY, CRM_API_USERNAME, CRM_API_PASSWORD");
  }

  const body = {
    key: apiKey,
    username: apiUsername,
    password: apiPassword,
    action: "insert",
    entity_id: payload.entityId ?? 70,
    items: {
      field_1039: payload.dealName,
      ...(payload.amount !== undefined ? { field_1040: payload.amount } : {}),
    },
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  logger.log("CRM response", { status: response.status, data: json });

  if (!response.ok) {
    throw new Error(`CRM API error ${response.status}: ${text}`);
  }

  return json;
}

export const createCrmDeal = task({
  id: "create-crm-deal",
  run: async (payload: CreateCrmDealPayload) => {
    return executeCreateCrmDeal(payload);
  },
});


