// Next.js API route для Inngest
// Этот файл обрабатывает все Inngest события и функции

import { serve } from "inngest/next";
import { inngest } from "../../inngest/client";
import { 
  handleAmoCrmWebhook,
  createErpTask
} from "../../inngest/functions";

export const functions = [
  handleAmoCrmWebhook,
  createErpTask,
];

// Настройка Inngest сервера для Next.js
export default serve({
  client: inngest,
  functions,
  
  // Настройки
  streaming: "allow",
});
