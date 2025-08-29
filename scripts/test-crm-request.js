// Simple test script to verify CRM API with env vars using dealName "123"
// Uses Node 18+ fetch

const apiUrl = process.env.CRM_API_URL;
const apiKey = process.env.CRM_API_KEY;
const apiUsername = process.env.CRM_API_USERNAME;
const apiPassword = process.env.CRM_API_PASSWORD;

if (!apiUrl || !apiKey || !apiUsername || !apiPassword) {
  console.error("Missing env vars: CRM_API_URL, CRM_API_KEY, CRM_API_USERNAME, CRM_API_PASSWORD");
  process.exit(1);
}

async function main() {
  const body = {
    key: apiKey,
    username: apiUsername,
    password: apiPassword,
    action: "insert",
    entity_id: 70,
    items: {
      field_1039: "123",
    },
  };

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  try {
    console.log("Status:", res.status);
    console.log("Response:", JSON.parse(text));
  } catch {
    console.log("Status:", res.status);
    console.log("Response (text):", text);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


