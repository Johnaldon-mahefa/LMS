// backend/test-mvola.js
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://devapi.mvola.mg";
const CONSUMER_KEY = process.env.MVOLA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MVOLA_CONSUMER_SECRET;
const MERCHANT = "0343500004";
const CLIENT = "0343500003";
const PARTNER = "TestMVola";

async function runTest() {
  console.log("--- 1. Obtention du Token ---");
  const basic = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  
  const tokenRes = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "EXT_INT_MVOLA_SCOPE",
    }),
  });

  if (!tokenRes.ok) {
    console.error("Échec du Token:", await tokenRes.text());
    return;
  }
  const { access_token } = await tokenRes.json();
  console.log("Token obtenu avec succès !");

  console.log("\n--- 2. Initiation du paiement ---");
  const reference = uuidv4();
  const correlationId = uuidv4();

  const body = {
    amount: "1000",
    currency: "Ar",
    descriptionText: "Test de paiement",
    requestDate: new Date().toISOString(),
    debitParty: [{ key: "msisdn", value: CLIENT }],
    creditParty: [{ key: "msisdn", value: MERCHANT }],
    metadata: [
      { key: "partnerName", value: PARTNER },
      { key: "fc", value: "USD" },
      { key: "amountFc", value: "1" },
    ],
    requestingOrganisationTransactionReference: reference,
    originalTransactionReference: reference,
  };

  const payRes = await fetch(`${BASE_URL}/mvola/mm/transactions/type/merchantpay/1.0.0/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      Version: "1.0",
      "X-CorrelationID": correlationId,
      UserLanguage: "FR",
      UserAccountIdentifier: `msisdn;${MERCHANT}`,
      partnerName: PARTNER,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payData = await payRes.json();
  
  if (!payRes.ok) {
    console.log("\n❌ ÉCHEC DU PAIEMENT. Voici la réponse exacte de MVola :");
    console.log(JSON.stringify(payData, null, 2));
  } else {
    console.log("\n✅ SUCCÈS ! Le paiement a été initié.");
    console.log(JSON.stringify(payData, null, 2));
  }
}

runTest().catch(console.error);