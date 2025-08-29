// Next.js API route для Inngest
// Этот файл обрабатывает все Inngest события и функции

import { serve } from "inngest/next";
import { inngest } from "../../src/inngest/client";
import { 
  // amoCRM Pipeline Tasks
  parseAmoCrmWebhook,
  authenticateAmoCrm,
  fetchAmoCrmLead,
  
  // ERP Tasks
  createErpTask,
  
  // Pipeline Tasks
  handleAmoCrmWebhook,
  completeIntegrationPipeline,
  
  // Legacy task
  createCrmDeal
} from "../../src/inngest/functions";

export const functions = [
  // Entry point
  handleAmoCrmWebhook,
  
  // amoCRM Pipeline
  parseAmoCrmWebhook,
  authenticateAmoCrm,
  fetchAmoCrmLead,
  
  // ERP Integration
  createErpTask,
  
  // Pipeline Completion
  completeIntegrationPipeline,
  
  // Legacy support
  createCrmDeal,
];

// Настройка Inngest сервера для Next.js
export default serve({
  client: inngest,
  functions,
  
  // Настройки
  streaming: "allow",
});
