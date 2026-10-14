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

// Dostawcy skonfigurowani na tym serwerze (wszystko, do czego są klucze/adresy; AI_PROVIDER wskazuje tylko domyślny wybór).
export function availableProviders() {
  const set = new Set(["mock"]); // tryb pokazowy zawsze dostępny: zapas po wyczerpaniu budżetu; reszta tylko gdy jest klucz lub adres
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
// Zarząd przełącza chmurę dla działu w panelu: {dział: true|false}, ważniejsze niż domyślne i .env
let panelOverrides = () => ({});
export const setDeptOverrides = fn => { panelOverrides = fn; };
function deptPolicy() {
  let p;
  try { p = { ...DEFAULT_DEPT_POLICY, ...JSON.parse(process.env.DEPT_POLICY_JSON || "{}") }; }
  catch { console.error("DEPT_POLICY_JSON: nieprawidłowy JSON, używam domyślnej polityki"); p = { ...DEFAULT_DEPT_POLICY }; }
  for (const [d, cloud] of Object.entries(panelOverrides())) p[d] = cloud ? ["mock", "ollama", "anthropic", "openai"] : ["mock", "ollama"];
  return p;
}
// Czy polityka działu pozwala na chmurę (niezależnie od tego, czy klucz dostawcy jest skonfigurowany)
export const deptCloudAllowed = dept => { const p = deptPolicy(); return (p[dept] || p["*"]).some(id => PROVIDERS[id]?.kind === "external"); };
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
import { luhn } from "./pii.js";
// PESEL z poprawną cyfrą kontrolną: do sprawdzania numerów sklejonych z kilku wiadomości (bez fałszywych alarmów)
const peselOk = d => { const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]; const s = w.reduce((a, x, i) => a + x * +d[i], 0); return (10 - s % 10) % 10 === +d[10]; };
// Normalizacja przed regułami: cyfry pełnej szerokości i inne warianty Unicode -> ASCII (NFKC), znaki niewidoczne usunięte,
// litera O/o i l/I wewnątrz ciągów cyfr -> 0/1 („44O514O1458”). Zapisu słownego („osiem pięć…”) reguły nie wyłapią: to ryzyko resztkowe.
export function normalizeForRules(text) {
  let t = String(text).normalize("NFKC").replace(/\p{Cf}/gu, "");
  for (let i = 0; i < 2; i++) t = t.replace(/(?<=\d)[Oo](?=[\dOo])|(?<=[\dOo])[Oo](?=\d)/g, "0").replace(/(?<=\d)[lI](?=\d)/g, "1");
  return t;
}
const HAS_PESEL_WORD = /pesel/i;
const RESTRICTED = [
  // PESEL: 11 cyfr z poprawną sumą kontrolną albo ze słowem „PESEL” obok; inaczej np. numer zamówienia nie jest blokowany
  [s => (s.match(/(?<![\d+])\d{6}[\s-]?\d{5}(?!\d)/g) || []).some(m => peselOk(m.replace(/\D/g, "")) || HAS_PESEL_WORD.test(s)), "PESEL"],
  [/(?<![\dA-Z])(?:PL\s?)?\d{2}(?:[\s-]?\d{4}){6}(?!\d)/, "numer konta"],
  [/(?<![A-Z])[A-Z]{3}\s?\d{6}(?!\d)/, "dokument tożsamości"],
  [/dow[oó]d\p{L}*\s*(?:osobist\p{L}*\s*)?(?:nr|numer)?\s*:?\s*[A-Za-z]{3}\s?\d{6}(?!\d)/iu, "dokument tożsamości"],
  // zdrowie: także zwykłym językiem („choruje”, „w szpitalu”); „diagnoza usterki” czy „diagnostyka agregatu” to nie dane o zdrowiu
  [/(diagnoz\p{L}*(?=[\s.,;:!?]|$)(?!\s+(?:usterk|awari|urządz|agregat|sprzęt|techn|system|instalac|pojazd|samochod|maszyn|sieci|serwer))|chorob|chor(?:uje|ował\p{L}*|a\s+na|y\s+na)\b|szpital|depresj|cukrzyc|nowotw|onkolog|psychiatr|zwolnieni\w* lekarsk|\bL4\b|ciąż|niepełnosprawn|leczeni|recept)/iu, "dane o zdrowiu"],
  // wynagrodzenia tylko w kontekście osoby: "pensja Kowalskiego", "ile zarabia Anna", "ile zarabia nasz handlowiec"; nie "ile zarabiamy na serwisie"
  [/([Ll]ist[aęy] płac|[Pp]ensj\p{L}*|[Ww]ynagrodzeni\p{L}*\s+(pracownik|[A-ZĄĆĘŁŃÓŚŹŻ])|[Zz]arabia\s+(pracownik|kolega|koleżanka|pan|pani|nasz\p{L}*|kierownik|handlowiec|księgow\p{L}*|[A-ZĄĆĘŁŃÓŚŹŻ]))/u, "wynagrodzenia"],
  [/\b(karta kredytow|\bCVV\b|hasło\s*[:=]|hasło\s+(?:do\s+\p{L}+\s+)?(?:to|jest)\s+\S+|password\s*[:=]|token\s*[:=])/iu, "dane uwierzytelniające"],
  [s => (s.match(/(?<!\d)\d(?:[ -]?\d){12,18}(?!\d)/g) || []).some(luhn), "numer karty"]
];
export function classify(message, piiCount) {
  const text = normalizeForRules(message);
  const hit = (r, s) => typeof r === "function" ? r(s) : r.test(s);
  const reasons = new Set(RESTRICTED.filter(([r]) => hit(r, text)).map(([, label]) => label));
  // numer rozbity na kilka wiadomości lub grup cyfr („8501” / „0112” / „345”): sklejamy cyfry i sprawdzamy sumy kontrolne
  const joined = text.replace(/(\d)[\s\-\/.]+(?=\d)/g, "$1");
  if ((joined.match(/(?<!\d)\d{11}(?!\d)/g) || []).some(peselOk)) reasons.add("PESEL");
  if (/(?<![\dA-Z])(?:PL)?\d{26}(?!\d)/.test(joined)) reasons.add("numer konta");
  if ((joined.match(/(?<!\d)\d{13,19}(?!\d)/g) || []).some(luhn)) reasons.add("numer karty");
  // części numeru przedzielone tekstem („pierwsza część: 440514”, „druga: 01458”): sąsiednie ciągi cyfr sklejone dają PESEL z sumą kontrolną
  const runs = joined.match(/\d+/g) || [];
  for (let i = 0; i + 1 < runs.length; i++) for (let j = i + 1; j < Math.min(runs.length, i + 4); j++) {
    const d = runs.slice(i, j + 1).join("");
    if (d.length === 11 && peselOk(d)) reasons.add("PESEL");
    if (d.length > 11) break;
  }
  return reasons.size ? { level: "restricted", reasons: [...reasons] } : classifyRest(piiCount);
}
function classifyRest(piiCount) {
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
    return { provider: null, kind: "blocked", blocked: true, reason: "zawiera dane chronione, a Twój dział nie ma dostępu do modelu w firmie" };
  }
  let chosen = byId(requested) || def;
  if (!chosen) return { provider: null, kind: "blocked", blocked: true, reason: "dział nie ma żadnego modelu do wyboru" };
  const budget = appMonthlyBudgetUsd();
  if (chosen.kind === "external" && budget > 0 && spentUsd >= budget) {
    const fallback = local || allowed.find(p => p.kind === "mock");
    if (fallback) return { provider: fallback.id, kind: fallback.kind, blocked: false, reason: `budżet na chmurę na ten miesiąc został wyczerpany (${budget} USD), dlatego odpowiada ${fallback.kind === "local" ? "model w firmie" : "tryb pokazowy"}` };
    return { provider: null, kind: "blocked", blocked: true, reason: `budżet na chmurę na ten miesiąc został wyczerpany (${budget} USD)` };
  }
  if (chosen.kind === "external" && cloudUsed >= cloudMonthlyLimit()) {
    if (local) return { provider: local.id, kind: "local", blocked: false, reason: `limit chmury na ten miesiąc został wyczerpany (${cloudMonthlyLimit()}), dlatego odpowiada model w firmie` };
    return { provider: null, kind: "blocked", blocked: true, reason: `limit chmury na ten miesiąc został wyczerpany (${cloudMonthlyLimit()})` };
  }
  return { provider: chosen.id, kind: chosen.kind, blocked: false, reason: chosen.kind === "external" ? "dane osobowe zamaskowane przed wysłaniem" : "dane zostały w firmie" };
}

// Dobór modelu do trudności pytania: proste (krótkie, jest trafienie w dokumentach, bez prośby o analizę) -> tani model,
// trudne (długie, "porównaj", "podsumuj", "raport") -> mocny. Pracownik wybiera dostawcę, poziom dobiera brama.
const HARD = /\b(porówna|podsumuj|streszcz|przeanalizuj|analiz|zestaw|raport|dlaczego|zaproponuj|napisz|przygotuj ofert|wyjaśnij|oceń|policz)/i;
export function tier(message, hits) {
  if (HARD.test(message) || message.length > 300) return "strong"; // brak dokumentów nie jest trudnością: takie pytania i tak omijają model albo są prośbą o akcję
  return "cheap";
}
// Nazwa modelu dla dostawcy i poziomu. Konfiguracja: ANTHROPIC_MODEL_CHEAP / ANTHROPIC_MODEL_STRONG (analogicznie OPENAI_),
// OLLAMA_MODEL dla modelu w firmie; MODEL ustawia jeden model na sztywno dla wszystkich poziomów.
const DEFAULT_MODELS = { anthropic: { cheap: "claude-haiku-5-5", strong: "claude-sonnet-5-5" }, openai: { cheap: "gpt-4o-mini", strong: "gpt-4o" } };
export function modelFor(provider, tierName) {
  if (!provider || provider === "mock") return null;
  if (provider === "ollama") return process.env.OLLAMA_MODEL || process.env.MODEL || "llama3.1";
  return process.env[`${provider.toUpperCase()}_MODEL_${tierName.toUpperCase()}`] || process.env.MODEL || DEFAULT_MODELS[provider]?.[tierName] || null;
}

// Koszty: tokeny z odpowiedzi dostawcy (albo szacunek ~4 znaki/token) i cena z PRICING_JSON w .env (USD za 1 mln tokenów),
// klucz = nazwa modelu albo dostawcy, np. {"claude-haiku-5-5":{"in":0.1,"out":0.5},"anthropic":{"in":4,"out":20}}. Brak = koszt nieznany (null).
export const estimateTokens = text => Math.ceil(String(text || "").length / 4);
export function costOf(provider, model, tokensIn, tokensOut) {
  if (!provider || PROVIDERS[provider]?.kind !== "external") return 0;
  let pricing = {}; try { pricing = JSON.parse(process.env.PRICING_JSON || "{}"); } catch { pricing = {}; }
  const p = (model && pricing[model]) || pricing[provider] || (appMonthlyBudgetUsd() > 0 ? { in: 4, out: 20 } : null); // brak cennika przy ustawionym budżecie: liczymy ostrożnie
  if (!p) return null;
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
