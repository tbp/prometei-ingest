// Тестовый endpoint для проверки Inngest подключения
import { NextApiRequest, NextApiResponse } from 'next';
import { Inngest } from 'inngest';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Проверяем переменные окружения
    const eventKey = process.env.INNGEST_EVENT_KEY;
    
    if (!eventKey) {
      return res.status(500).json({
        error: 'Missing INNGEST_EVENT_KEY',
        env: {
          INNGEST_EVENT_KEY: eventKey ? '✅ Set' : '❌ Missing',
          INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY ? '✅ Set' : '❌ Missing'
        }
      });
    }

    // Создаем Inngest клиент
    const inngest = new Inngest({
      id: "prometei-test",
      eventKey: eventKey,
    });

    // Пытаемся отправить тестовое событие
    await inngest.send({
      name: 'test/connection',
      data: {
        message: 'Test connection from API endpoint',
        timestamp: new Date().toISOString()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Inngest connection successful',
      eventKey: eventKey.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Inngest test error:', error);
    
    return res.status(500).json({
      error: 'Inngest connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
