// Простой тестовый webhook без Inngest
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`📥 Received ${req.method} request to webhook-test`);
  
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Test Webhook Endpoint',
      status: 'Ready',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    console.log('📋 Webhook data received:', {
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    // Парсим данные в формате amoCRM
    let parsedData = null;
    let entity = null;
    let action = null;
    
    if (typeof req.body === 'object' && req.body !== null) {
      for (const [entityName, entityData] of Object.entries(req.body)) {
        if (typeof entityData === 'object' && entityData !== null) {
          for (const [actionName, actionData] of Object.entries(entityData as Record<string, any>)) {
            if (Array.isArray(actionData) && actionData.length > 0) {
              entity = entityName;
              action = actionName;
              parsedData = actionData[0];
              break;
            }
          }
        }
        if (parsedData) break;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook data received and parsed',
      parsed: {
        entity,
        action,
        leadId: parsedData?.id,
        leadName: parsedData?.name,
        leadPrice: parsedData?.price,
        data: parsedData
      },
      raw: req.body,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
