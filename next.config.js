/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Включаем поддержку серверных компонентов
    serverComponentsExternalPackages: ['inngest']
  },
  
  // Настройки для API routes
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: false,
  },

  // Переменные окружения
  env: {
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  },

  // Настройки для production
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig
