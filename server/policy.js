// Polityka bramy AI: dostępni dostawcy, polityka per dział, klasyfikacja wrażliwości, trasa, limity i koszty.
// Zasady:
//   - dane jawne i wewnętrzne (po zamaskowaniu) mogą iść do dostawcy, którego dział ma dozwolonego,
//   - dane chronione idą wyłącznie do modelu lokalnego; bez niego wiadomość zostaje w bramie,
//   - pracownik wybiera tylko spośród dostawców dozwolonych dla swojego działu (ustawia administrator),
//   - chmura ma miesięczny limit zapytań na dział; po jego wyczerpaniu zapytania idą lokalnie albo są zatrzymywane.
// W produkcji: klasyfikator NER/ML (np. Microsoft Presidio) zamiast reguł, polityka w konfiguracji/panelu administratora.

export const PROVIDERS = {
  mock:      { label: "tryb pokazowy, bez modelu", kind: "mock" },
  ollama:    { label: "model w firmie (Ollama)",   kind: "local" },
  anthropic: { label: "Claude (chmura)",           kind: "external" },
  openai:    { label: "GPT (chmura)",              kind: "external" }
};

// Dostawcy skonfigurowani na tym serwerze (domyślny AI_PROVIDER plus wszystko, do czego są klucze/adresy).
export function availableProviders() {
  const set = new Set(["mock", process.env.AI_PROVIDER || "mock"]); // tryb pokazowy zawsze dostępny: zapas po wyczerpaniu budżetu
  if (process.env.OLLAMA_URL) set.add("ollama");
  if (process.env.ANTHROPIC_API_KEY) set.add("anthropic");
  if (process.env.OPENAI_API_KEY) set.add("openai");
  return [...set].filter(p => PROVIDERS[p]).map(id => ({ id, ...PROVIDERS[id] }));
}

// Polityka per dział: które rodzaje dostawców wolno. Administrator nadpisuje przez DEPT_POLICY_JSON w .env,
// np. {"ksiegowosc":["mock","ollama"],"*":["mock","ollama","anthropic"]}
const DEFAULT_DEPT_POLICY = {
  ksiegowosc: ["mock", "ollama"],           // faktury, kwoty, NIP-y: tylko model w firmie
  zarzad:     ["mock", "ollama"],           // dane strategiczne: tylko model w firmie
  "*":        ["mock", "ollama", "anthropic", "openai"]
};
function deptPolicy() {
  try { return { ...DEFAULT_DEPT_POLICY, ...JSON.parse(process.env.DEPT_POLICY_JSON || "{}") }; }
  catch { console.error("DEPT_POLICY_JSON: nieprawidłowy JSON, używam domyślnej polityki"); return DEFAULT_DEPT_POLICY; }
}
export function allowedFor(dept) {
  const policy = deptPolicy();
  const allowed = policy[dept] || policy["*"];
  return availableProviders().filter(p => allowed.includes(p.id));
}
export const cloudMonthlyLimit = () => Number(process.env.CLOUD_MONTHLY_LIMIT || 500);
// Bezpiecznik kosztów: łączny miesięczny budżet na chmurę dla całej aplikacji w USD (0 = bez limitu).
// Po przekroczeniu pytania wracają do modelu w firmie albo do trybu pokazowego. Drugi bezpiecznik to limit wydatków w konsoli dostawcy.
export const appMonthlyBudgetUsd = () => Number(process.env.APP_MONTHLY_BUDGET_USD || 0);

// Klasyfikacja wiadomości: "public" | "internal" | "restricted"
const RESTRICTED = [
  [/\b\d{11}\b/, "PESEL"],
  [/\b\d{2}(?:[\s-]?\d{4}){6}\b/, "numer konta"],
  [/\b(diagnoz|chorob|zwolnieni\w* lekarsk|\bL4\b|ciąż|niepełnosprawn|leczeni|recept)/iu, "dane o zdrowiu"],
  [/\b(wynagrodzeni|pensj|lista płac|wypłat[ay]\b|zarabia)/iu, "wynagrodzenia"],
  [/\b(karta kredytow|\bCVV\b|hasło\s*[:=]|token\s*[:=])/iu, "dane uwierzytelniające"]
];
export function classify(message, piiCount) {
  const reasons = [...new Set(RESTRICTED.filter(([re]) => re.test(message)).map(([, label]) => label))];
  if (reasons.length) return { level: "restricted", reasons };
  if (piiCount > 0) return { level: "internal", reasons: ["dane osobowe (zamaskowane)"] };
  return { level: "public", reasons: [] };
}

// Trasa: dokąd może pójść wiadomość.
//   level     – poziom z classify()
//   dept      – dział użytkownika
//   requested – dostawca wybrany przez pracownika w nagłówku (może być pusty)
//   cloudUsed – ile zapytań do chmury dział wysłał w tym miesiącu
export function decide({ level, dept, requested, cloudUsed, spentUsd = 0 }) {
  const allowed = allowedFor(dept);
  const local = allowed.find(p => p.kind === "local");
  const byId = id => allowed.find(p => p.id === id);
  // domyślny: skonfigurowany AI_PROVIDER, jeśli dział go ma; inaczej model w firmie, inaczej tryb pokazowy
  const def = byId(process.env.AI_PROVIDER) || local || allowed.find(p => p.kind === "mock") || allowed[0];
  if (level === "restricted") {
    if (local) return { provider: local.id, kind: "local", blocked: false, reason: "dane chronione, zostają w firmie" };
    return { provider: null, kind: "blocked", blocked: true, reason: "dane chronione, a dział nie ma modelu w firmie" };
  }
  let chosen = byId(requested) || def;
  if (!chosen) return { provider: null, kind: "blocked", blocked: true, reason: "dział nie ma żadnego modelu do wyboru" };
  const budget = appMonthlyBudgetUsd();
  if (chosen.kind === "external" && budget > 0 && spentUsd >= budget) {
    const fallback = local || allowed.find(p => p.kind === "mock");
    if (fallback) return { provider: fallback.id, kind: fallback.kind, blocked: false, reason: `budżet na chmurę w tym miesiącu wyczerpany (${budget} USD), użyto: ${fallback.kind === "local" ? "modelu w firmie" : "trybu pokazowego"}` };
    return { provider: null, kind: "blocked", blocked: true, reason: `budżet na chmurę w tym miesiącu wyczerpany (${budget} USD)` };
  }
  if (chosen.kind === "external" && cloudUsed >= cloudMonthlyLimit()) {
    if (local) return { provider: local.id, kind: "local", blocked: false, reason: `limit chmury na ten miesiąc wyczerpany (${cloudMonthlyLimit()}), użyto modelu w firmie` };
    return { provider: null, kind: "blocked", blocked: true, reason: `limit chmury na ten miesiąc wyczerpany (${cloudMonthlyLimit()})` };
  }
  return { provider: chosen.id, kind: chosen.kind, blocked: false, reason: chosen.kind === "external" ? "dane osobowe zamazane przed wysyłką" : "dane zostały w firmie" };
}

// Koszty: szacunek tokenów (ok. 4 znaki na token) i cena z PRICING_JSON w .env (USD za 1 mln tokenów),
// np. {"anthropic":{"in":3,"out":15},"openai":{"in":0.15,"out":0.6}}. Brak cennika = koszt nieznany (null).
export const estimateTokens = text => Math.ceil(String(text || "").length / 4);
export function costOf(provider, tokensIn, tokensOut) {
  if (!provider || PROVIDERS[provider]?.kind !== "external") return 0;
  let pricing = {}; try { pricing = JSON.parse(process.env.PRICING_JSON || "{}"); } catch { pricing = {}; }
  const p = pricing[provider]; if (!p) return null;
  return +((tokensIn * (p.in || 0) + tokensOut * (p.out || 0)) / 1e6).toFixed(5);
}

// Alert dla administratora przy zablokowanej wiadomości: bez treści, tylko kto, dział, powód.
// ALERT_WEBHOOK_URL = adres webhooka (Teams, Slack, Telegram przez n8n). Brak = cicho.
export async function alert(event) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: `Compax: zatrzymano wiadomość (${event.reasons.join(", ")}) – użytkownik ${event.userId}, dział ${event.dept}, ${event.ts}` }) });
  } catch (e) { console.error("alert webhook:", e.message); }
}
