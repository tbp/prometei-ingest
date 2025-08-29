// Next.js API route для Inngest
// Этот файл обрабатывает все Inngest события и функции

import { serve } from "inngest/next";
import { inngest } from "../../src/inngest/client";
import { 
  createCrmDeal,
  handleAmoCrmWebhook
} from "../../src/inngest/functions/createCrmDeal";

export const functions = [
  createCrmDeal,
  handleAmoCrmWebhook,
];

// Настройка Inngest сервера для Next.js
export default serve({
  client: inngest,
  functions,
  
  // Настройки
  streaming: "allow",
});
