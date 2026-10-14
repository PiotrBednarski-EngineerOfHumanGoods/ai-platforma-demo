// Klasyfikacja wrażliwości i trasowanie w bramie AI.
// Zasada: dane jawne i wewnętrzne (po zamaskowaniu) mogą iść do modelu zewnętrznego,
// dane chronione wyłącznie do modelu lokalnego, a gdy go nie ma, nie wychodzą nigdzie.
// W produkcji: klasyfikator NER/ML (np. Microsoft Presidio) zamiast reguł, polityka per dział w konfiguracji.

const RESTRICTED = [
  [/\b\d{11}\b/, "PESEL"],
  [/\b\d{2}(?:[\s-]?\d{4}){6}\b/, "numer konta"],
  [/\b(diagnoz|chorob|zwolnieni\w* lekarsk|\bL4\b|ciąż|niepełnosprawn|leczeni|recept)/iu, "dane o zdrowiu"],
  [/\b(wynagrodzeni|pensj|lista płac|wypłat[ay]\b|zarabia)/iu, "wynagrodzenia"],
  [/\b(karta kredytow|\bCVV\b|hasło\s*[:=]|token\s*[:=])/iu, "dane uwierzytelniające"]
];

// level: "public" | "internal" | "restricted"; reasons: co zdecydowało
export function classify(message, piiCount) {
  const reasons = RESTRICTED.filter(([re]) => re.test(message)).map(([, label]) => label);
  if (reasons.length) return { level: "restricted", reasons: [...new Set(reasons)] };
  if (piiCount > 0) return { level: "internal", reasons: ["dane osobowe (zamaskowane)"] };
  return { level: "public", reasons: [] };
}

// Trasa: do którego dostawcy może pójść wiadomość o danym poziomie.
//   provider      – dostawca skonfigurowany (mock | anthropic | openai | ollama)
//   localProvider – dostawca lokalny, jeśli jest (ollama), albo null
export function route(level, provider, localProvider) {
  if (level === "restricted") {
    if (localProvider) return { provider: localProvider, kind: "local", blocked: false };
    return { provider: null, kind: "blocked", blocked: true };
  }
  if (provider === "mock") return { provider, kind: "mock", blocked: false };
  return { provider, kind: provider === "ollama" ? "local" : "external", blocked: false };
}

// Alert dla administratora przy zablokowanej wiadomości: bez treści, tylko kto, dział, powód.
// ALERT_WEBHOOK_URL = adres webhooka (Teams, Slack, Telegram przez n8n). Brak = cicho.
export async function alert(event) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: `Compax: zablokowano wysyłkę danych chronionych (${event.reasons.join(", ")}) – użytkownik ${event.userId}, dział ${event.dept}, ${event.ts}` }) });
  } catch (e) { console.error("alert webhook:", e.message); }
}
