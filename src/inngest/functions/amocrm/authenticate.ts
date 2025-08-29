import { inngest } from "../../client";

type AmoCrmTokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
};

/**
 * Task 2: Авторизация в amoCRM API
 * Получает access token для дальнейших запросов
 */
export const authenticateAmoCrm = inngest.createFunction(
  { id: "amocrm-authenticate", retries: 3 },
  { event: "amocrm/auth.required" },
  async ({ event }) => {
    const { AMOCRM_CLIENT_ID, AMOCRM_CLIENT_SECRET, AMOCRM_REDIRECT_URI, AMOCRM_REFRESH_TOKEN } = process.env;
    
    // Получаем поддомен из event данных
    const subdomain = event.data.subdomain || event.data.parsedData?.subdomain;

    if (!AMOCRM_CLIENT_ID || !AMOCRM_CLIENT_SECRET || !AMOCRM_REDIRECT_URI || !AMOCRM_REFRESH_TOKEN) {
      throw new Error("Missing amoCRM environment variables");
    }

    if (!subdomain) {
      throw new Error("Missing subdomain in event data");
    }

    console.log(`🔐 Authenticating with amoCRM for subdomain: ${subdomain}`);

    const response = await fetch(`https://${subdomain}.amocrm.ru/oauth2/access_token`, {
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
    
    console.log("✅ amoCRM authentication successful");

    // Запускаем следующий task с токеном
    await inngest.send({
      name: "amocrm/lead.fetch",
      data: {
        ...event.data,
        accessToken: tokenData.access_token
      }
    });

    return {
      success: true,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in
    };
  }
);
