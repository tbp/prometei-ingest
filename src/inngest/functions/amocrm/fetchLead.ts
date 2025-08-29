import { inngest } from "../../client";

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
 * Task 3: Получение данных сделки из amoCRM
 * Загружает полную информацию о сделке по ID
 */
export const fetchAmoCrmLead = inngest.createFunction(
  { id: "amocrm-fetch-lead", retries: 3 },
  { event: "amocrm/lead.fetch" },
  async ({ event }) => {
    const { leadId, accessToken, subdomain } = event.data;
    
    // Используем поддомен из event данных или из parsedData
    const amocrmSubdomain = subdomain || event.data.parsedData?.subdomain;

    if (!amocrmSubdomain) {
      throw new Error("Missing subdomain in event data");
    }

    console.log(`📥 Fetching lead data for ID: ${leadId} from ${amocrmSubdomain}`);

    const response = await fetch(`https://${amocrmSubdomain}.amocrm.ru/api/v4/leads/${leadId}`, {
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
    
    console.log(`📋 Lead fetched: ${leadData.name}, price: ${leadData.price}`);

    // Запускаем создание задачи в ERP
    await inngest.send({
      name: "erp/task.create",
      data: {
        // Данные из webhook
        webhookId: event.data.webhookId,
        pipelineChanged: event.data.pipelineChanged,
        statusChanged: event.data.statusChanged,
        
        // Данные сделки из amoCRM
        leadId: leadData.id,
        leadName: leadData.name,
        leadPrice: leadData.price,
        leadStatusId: leadData.status_id,
        leadPipelineId: leadData.pipeline_id,
        leadResponsibleUserId: leadData.responsible_user_id,
        leadCreatedAt: leadData.created_at,
        leadUpdatedAt: leadData.updated_at,
        
        // Дополнительные данные
        customFields: leadData.custom_fields_values,
        isDeleted: leadData.is_deleted,
        score: leadData.score
      }
    });

    return {
      success: true,
      lead: {
        id: leadData.id,
        name: leadData.name,
        price: leadData.price,
        status_id: leadData.status_id,
        pipeline_id: leadData.pipeline_id
      }
    };
  }
);
