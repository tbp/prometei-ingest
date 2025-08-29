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
      contentType: req.headers['content-type'],
      body: req.body,
      query: req.query
    });

    // Парсим URL-encoded данные от amoCRM
    const leadId = req.body['leads[status][0][id]'];
    const statusId = req.body['leads[status][0][status_id]'];
    const pipelineId = req.body['leads[status][0][pipeline_id]'];
    const oldStatusId = req.body['leads[status][0][old_status_id]'];
    const oldPipelineId = req.body['leads[status][0][old_pipeline_id]'];
    const accountId = req.body['account[id]'];
    const subdomain = req.body['account[subdomain]'];

    return res.status(200).json({
      success: true,
      message: 'amoCRM webhook data received and parsed',
      parsed: {
        leadId,
        statusId,
        pipelineId,
        oldStatusId,
        oldPipelineId,
        accountId,
        subdomain,
        statusChanged: statusId !== oldStatusId,
        pipelineChanged: pipelineId !== oldPipelineId
      },
      raw: req.body,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
