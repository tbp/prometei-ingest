// Inngest configuration
export default {
  client: {
    id: "prometei-flow",
    name: "Prometei Flow - CRM Integration"
  },
  
  // Настройки для разработки
  dev: {
    port: 8288,
    host: "localhost"
  },

  // Настройки для production
  production: {
    // Здесь можно настроить production параметры
    // например, custom endpoints, authentication и т.д.
  },

  // Настройки функций
  functions: {
    // Глобальные настройки retry для всех функций
    retries: {
      attempts: 3,
      delay: "1s"
    },
    
    // Таймауты
    timeout: "5m"
  }
};
