// Next.js API route для приема webhook от amoCRM
// Этот endpoint принимает webhook от amoCRM и отправляет событие в Inngest

import { NextApiRequest, NextApiResponse } from 'next';
import { Inngest } from 'inngest';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Принимаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Проверяем переменные окружения Inngest
    if (!process.env.INNGEST_EVENT_KEY) {
      throw new Error('Missing INNGEST_EVENT_KEY environment variable');
    }

    console.log('📥 Received amoCRM webhook:', {
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    // Создаем Inngest клиент с правильной конфигурацией
    const inngest = new Inngest({
      id: "prometei-ingest",
      eventKey: process.env.INNGEST_EVENT_KEY,
    });

    // Отправляем событие в Inngest для обработки
    await inngest.send({
      name: 'amocrm/webhook',
      data: {
        // Передаем все данные от amoCRM
        ...req.body,
        // Добавляем метаданные
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
