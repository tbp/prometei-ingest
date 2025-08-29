// Next.js API route для приема webhook от amoCRM
// Этот endpoint принимает webhook от amoCRM и отправляет событие в Inngest

import { NextApiRequest, NextApiResponse } from 'next';
import { Inngest } from 'inngest';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Логируем метод запроса для отладки
  console.log(`📥 Received ${req.method} request to amocrm-webhook`);
  
  // Принимаем POST и GET запросы (amoCRM может использовать разные методы)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      receivedMethod: req.method,
      allowedMethods: ['POST', 'GET']
    });
  }

  // Если GET запрос, возвращаем информацию о webhook
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'amoCRM Webhook Endpoint',
      status: 'Ready',
      allowedMethods: ['POST', 'GET'],
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Проверяем переменные окружения Inngest
    if (!process.env.INNGEST_EVENT_KEY) {
      throw new Error('Missing INNGEST_EVENT_KEY environment variable');
    }

    // Парсим данные webhook в формате {"entity":{"action":{массив полей сущности}}}
    const webhookData = req.body;
    
    console.log('📥 Received amoCRM webhook (raw):', {
      headers: req.headers,
      body: webhookData,
      query: req.query
    });

    // Извлекаем данные из структуры amoCRM webhook
    let parsedData = null;
    let entity = null;
    let action = null;
    
    // Проверяем разные возможные структуры данных
    if (typeof webhookData === 'object' && webhookData !== null) {
      // Ищем структуру {"entity":{"action":{...}}}
      for (const [entityName, entityData] of Object.entries(webhookData)) {
        if (typeof entityData === 'object' && entityData !== null) {
          for (const [actionName, actionData] of Object.entries(entityData as Record<string, any>)) {
            if (Array.isArray(actionData) && actionData.length > 0) {
              entity = entityName;
              action = actionName;
              parsedData = actionData[0]; // Берем первый элемент массива
              break;
            }
          }
        }
        if (parsedData) break;
      }
    }

    console.log('📋 Parsed webhook data:', {
      entity,
      action,
      parsedData,
      leadId: parsedData?.id,
      accountId: parsedData?.account_id,
      subdomain: 'oooprometei' // Используем известный поддомен
    });

    // Проверяем, что получили данные сделки
    if (!parsedData || !parsedData.id) {
      throw new Error('Missing lead data in webhook');
    }

    // Создаем Inngest клиент с правильной конфигурацией
    const inngest = new Inngest({
      id: "prometei-ingest",
      eventKey: process.env.INNGEST_EVENT_KEY,
    });

    // Отправляем событие в Inngest для обработки
    await inngest.send({
      name: 'amocrm/webhook',
      data: {
        // Оригинальные данные webhook
        originalData: webhookData,
        
        // Извлеченные и обработанные данные
        entity,
        action,
        leadData: parsedData,
        
        // Структурированные данные для удобства
        parsedData: {
          subdomain: 'oooprometei',
          leadId: parsedData.id,
          accountId: parsedData.account_id,
          leadName: parsedData.name,
          leadPrice: parsedData.price,
          pipelineId: parsedData.pipeline_id,
          statusId: parsedData.status_id,
          oldPipelineId: parsedData.old_pipeline_id,
          oldStatusId: parsedData.old_status_id,
          responsibleUserId: parsedData.responsible_user_id,
          createdAt: parsedData.created_at,
          updatedAt: parsedData.updated_at,
        },
        
        // Метаданные
        receivedAt: new Date().toISOString(),
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      }
    });

    console.log('✅ amoCRM webhook event sent to Inngest');

    // Возвращаем успешный ответ amoCRM
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook received and processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing amoCRM webhook:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
