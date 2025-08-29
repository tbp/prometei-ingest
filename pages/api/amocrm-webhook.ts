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

    // amoCRM отправляет данные в формате URL-encoded form data
    const webhookData = req.body;
    
    console.log('📥 Received amoCRM webhook (raw):', {
      headers: req.headers,
      contentType: req.headers['content-type'],
      body: webhookData,
      query: req.query
    });

    // Извлекаем данные из URL-encoded формата
    const leadId = webhookData['leads[status][0][id]'];
    const statusId = webhookData['leads[status][0][status_id]'];
    const pipelineId = webhookData['leads[status][0][pipeline_id]'];
    const oldStatusId = webhookData['leads[status][0][old_status_id]'];
    const oldPipelineId = webhookData['leads[status][0][old_pipeline_id]'];
    const accountId = webhookData['account[id]'];
    const subdomain = webhookData['account[subdomain]'];

    console.log('📋 Parsed webhook data:', {
      leadId,
      statusId,
      pipelineId,
      oldStatusId,
      oldPipelineId,
      accountId,
      subdomain
    });

    // Проверяем обязательные данные
    if (!leadId) {
      throw new Error('Missing lead ID in webhook data');
    }
    if (!subdomain) {
      throw new Error('Missing subdomain in webhook data');
    }

    // Создаем структурированные данные
    const parsedData = {
      leadId: parseInt(leadId),
      statusId: parseInt(statusId),
      pipelineId: parseInt(pipelineId),
      oldStatusId: oldStatusId ? parseInt(oldStatusId) : null,
      oldPipelineId: oldPipelineId ? parseInt(oldPipelineId) : null,
      accountId: parseInt(accountId),
      subdomain: subdomain,
      // Определяем тип изменения
      statusChanged: statusId !== oldStatusId,
      pipelineChanged: pipelineId !== oldPipelineId
    };

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
        entity: 'leads',
        action: 'status_change',
        
        // Структурированные данные для удобства
        parsedData: parsedData,
        
        // Метаданные
        receivedAt: new Date().toISOString(),
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        
        // Флаги изменений
        changes: {
          statusChanged: parsedData.statusChanged,
          pipelineChanged: parsedData.pipelineChanged
        }
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
