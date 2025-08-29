// Тестовый endpoint для проверки переменных окружения
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const envVars = {
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY ? '✅ Set' : '❌ Missing',
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY ? '✅ Set' : '❌ Missing',
    AMOCRM_SUBDOMAIN: process.env.AMOCRM_SUBDOMAIN ? '✅ Set' : '❌ Missing',
    AMOCRM_ACCESS_TOKEN: process.env.AMOCRM_ACCESS_TOKEN ? '✅ Set' : '❌ Missing',
    ERP_API_URL: process.env.ERP_API_URL ? '✅ Set' : '❌ Missing',
    ERP_API_KEY: process.env.ERP_API_KEY ? '✅ Set' : '❌ Missing',
    ERP_API_USERNAME: process.env.ERP_API_USERNAME ? '✅ Set' : '❌ Missing',
    ERP_API_PASSWORD: process.env.ERP_API_PASSWORD ? '✅ Set' : '❌ Missing',
    NODE_ENV: process.env.NODE_ENV || 'undefined'
  };

  return res.status(200).json({
    message: 'Environment Variables Check',
    environment: envVars,
    timestamp: new Date().toISOString()
  });
}
