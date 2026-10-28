import dns from "node:dns";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../utils/AppError.js";

// Force l'IPv4 pour éviter les timeouts réseau
dns.setDefaultResultOrder("ipv4first");

const BASE_URL = process.env.MVOLA_BASE_URL || "https://devapi.mvola.mg";
const MERCHANT = process.env.MVOLA_MERCHANT_MSISDN || "0343500004";
const CLIENT = process.env.MVOLA_CLIENT_MSISDN || "0343500003";
const PARTNER = process.env.MVOLA_PARTNER_NAME || "TestMVola";

const ERREURS_CONNEXION = ["ENOTFOUND", "ECONNREFUSED", "ENETUNREACH", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT", "ETIMEDOUT"];

async function fetchRobuste(url, options = {}, { tentatives = 3, timeoutMs = 15000, toutRetry = true } = {}) {
  let derniere;
  for (let i = 1; i <= tentatives; i++) {
    try {
      return await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      derniere = err;
      const code = err.cause?.code || err.name;
      console.warn(`⚠️ MVola réseau, essai ${i}/${tentatives} :`, code);
      const reessayable = toutRetry || ERREURS_CONNEXION.includes(err.cause?.code);
      if (!reessayable || i === tentatives) break;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
  throw new AppError(503, `MVola injoignable. Veuillez réessayer. (${derniere.cause?.code || derniere.message})`);
}

let tokenCache = { value: null, expire: 0 };

async function getMVolaToken() {
  if (tokenCache.value && Date.now() < tokenCache.expire) return tokenCache.value;

  const key = process.env.MVOLA_CONSUMER_KEY;
  const secret = process.env.MVOLA_CONSUMER_SECRET;
  if (!key || !secret) throw new AppError(500, "Clés MVola non configurées.");

  const basic = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetchRobuste(`${BASE_URL}/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "EXT_INT_MVOLA_SCOPE" }),
  });

  if (!res.ok) throw new AppError(500, "Échec de l'authentification MVola.");
  
  const data = await res.json();
  tokenCache = { value: data.access_token, expire: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000 };
  return tokenCache.value;
}

const nettoyer = (txt) =>
  String(txt).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().slice(0, 50);

const enTetes = (token, correlationId) => ({
  Authorization: `Bearer ${token}`,
  Version: "1.0",
  "X-CorrelationID": correlationId,
  UserLanguage: "FR",
  UserAccountIdentifier: `msisdn;${MERCHANT}`,
  partnerName: PARTNER,
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
});

export async function initierPaiementMvola(idEtablissement, montant, idPlan) {
  const montantAr = Math.round(Number(montant));
  
  // 🛑 VÉRIFICATION DU MONTANT MINIMUM (100 Ar)
  if (!Number.isFinite(montantAr) || montantAr <= 0) {
    throw new AppError(400, `Montant invalide pour MVola : ${montant}`);
  }
  if (montantAr < 100) {
    throw new AppError(400, `Le montant minimum pour un paiement MVola est de 100 Ar. Votre plan coûte ${montantAr} Ar.`);
  }

  const token = await getMVolaToken();
  const reference = uuidv4();
  const correlationId = uuidv4();

  const body = {
    amount: String(montantAr),
    currency: "Ar",
    descriptionText: nettoyer(`Abonnement LMS plan ${idPlan}`),
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

  const res = await fetchRobuste(
    `${BASE_URL}/mvola/mm/transactions/type/merchantpay/1.0.0/`,
    { method: "POST", headers: enTetes(token, correlationId), body: JSON.stringify(body) },
    { toutRetry: false }
  );
  
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("MVola init KO", { status: res.status, reponse: data });
    throw new AppError(400, data.errorDescription || "Échec de l'initiation du paiement.");
  }

  return {
    success: true,
    transactionRef: reference,
    serverCorrelationId: data.serverCorrelationId,
    status: data.status, // "pending"
  };
}

export async function verifierStatutPaiementMvola(serverCorrelationId) {
  const token = await getMVolaToken();
  const res = await fetchRobuste(
    `${BASE_URL}/mvola/mm/transactions/type/merchantpay/1.0.0/status/${serverCorrelationId}`,
    { headers: enTetes(token, uuidv4()) }
  );
  const data = await res.json().catch(() => ({}));
  return data;
}