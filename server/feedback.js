// Zgłoszenia od pracowników (przycisk „Zgłoś”): problem, pomysł albo pytanie.
// Treść jest maskowana (dane osobowe nie wychodzą z serwera), zapisywana zaszyfrowana
// i od razu wysyłana do opiekuna systemu: e-mailem przez Resend (RESEND_API_KEY + FEEDBACK_TO)
// albo na webhook (FEEDBACK_WEBHOOK). Bez konfiguracji zgłoszenie i tak trafia do panelu zarządu.
import { mask } from "./pii.js";

export const FEEDBACK_TYPES = { problem: "Problem", pomysl: "Pomysł", pytanie: "Pytanie" };

export function validateFeedback(body) {
  const { type, text, context } = body || {};
  if (!FEEDBACK_TYPES[type]) return { error: "Wybierz rodzaj zgłoszenia." };
  if (typeof text !== "string" || text.trim().length < 10) return { error: "Opisz sprawę w co najmniej 10 znakach." };
  if (text.length > 2000) return { error: "Zgłoszenie może mieć najwyżej 2000 znaków." };
  const ctx = context && typeof context === "object" ? context : {};
  // kontekst techniczny tylko z listy pól, przycięty: żadnych dowolnych danych z przeglądarki
  const safeCtx = Object.fromEntries(["tab", "screen", "browser", "theme"].filter(k => ctx[k] != null).map(k => [k, String(ctx[k]).slice(0, 160)]));
  return { type, text: mask(text.trim()).masked, context: safeCtx };
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Wysyłka do opiekuna. Zwraca kanał, którym poszło: "email" | "webhook" | null (tylko zapis).
export async function notifyFeedback(item, { fetchImpl = fetch } = {}) {
  const label = FEEDBACK_TYPES[item.type];
  const subject = `[Compax] ${label}: ${item.text.replace(/\s+/g, " ").slice(0, 60)}`;
  const lines = [`${label} od: ${item.userName} (${item.deptName})`, `Kiedy: ${new Date(item.ts).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}`, "", item.text, "",
    ...Object.entries(item.context).map(([k, v]) => `${k}: ${v}`), "", `Numer zgłoszenia: ${item.id}`];
  try {
    if (process.env.RESEND_API_KEY && process.env.FEEDBACK_TO) {
      const r = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.FEEDBACK_FROM || "Compax <onboarding@resend.dev>",
          to: process.env.FEEDBACK_TO.split(",").map(s => s.trim()),
          subject, text: lines.join("\n"),
          html: `<p><b>${esc(lines[0])}</b><br>${esc(lines[1])}</p><p style="white-space:pre-wrap">${esc(item.text)}</p><p style="color:#71717A">${lines.slice(5).map(esc).join("<br>")}</p>`
        })
      });
      if (r.ok) return "email";
      console.error("feedback email:", r.status);
    }
    if (process.env.FEEDBACK_WEBHOOK) {
      const r = await fetchImpl(process.env.FEEDBACK_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, text: lines.join("\n") }) });
      if (r.ok) return "webhook";
    }
  } catch (e) { console.error("feedback notify:", e.message); }
  return null;
}
