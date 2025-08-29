import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "prometei-ingest",
  name: "Prometei Ingest - amoCRM to ERP Pipeline",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
