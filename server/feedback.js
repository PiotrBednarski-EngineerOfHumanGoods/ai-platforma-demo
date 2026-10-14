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
  const shot = parseScreenshot(body.screenshot);
  if (shot && shot.error) return shot;
  return { type, text: mask(text.trim()).masked, context: safeCtx, screenshot: shot };
}

// Zrzut ekranu: tylko PNG, JPEG albo WebP, rozpoznane po zawartości (nie po deklaracji), do 2,5 MB.
// SVG i inne formaty odrzucamy (mogą zawierać skrypt).
export const MAX_SHOT = 2.5 * 1024 * 1024;
export function parseScreenshot(dataUrl) {
  if (dataUrl == null || dataUrl === "") return null;
  const m = typeof dataUrl === "string" && dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return { error: "Zrzut ekranu musi być obrazem PNG, JPG albo WebP." };
  const buf = Buffer.from(m[2], "base64");
  if (!buf.length || buf.length > MAX_SHOT) return { error: "Zrzut ekranu może mieć najwyżej 2,5 MB." };
  const kind = buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) ? "png"
    : buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff ? "jpeg"
    : buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP" ? "webp" : null;
  if (!kind) return { error: "Plik nie jest prawidłowym obrazem PNG, JPG ani WebP." };
  return { mime: `image/${kind}`, ext: kind === "jpeg" ? "jpg" : kind, buf };
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Wysyłka do opiekuna. Zwraca kanał, którym poszło: "email" | "webhook" | null (tylko zapis).
export async function notifyFeedback(item, { fetchImpl = fetch, attachment = null } = {}) {
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
          ...(attachment ? { attachments: [{ filename: attachment.filename, content: attachment.buf.toString("base64") }] } : {}),
          html: `<p><b>${esc(lines[0])}</b><br>${esc(lines[1])}</p><p style="white-space:pre-wrap">${esc(item.text)}</p><p style="color:#71717A">${lines.slice(5).map(esc).join("<br>")}</p>`
        })
      });
      if (r.ok) return "email";
      console.error("feedback email:", r.status);
    }
    if (process.env.FEEDBACK_WEBHOOK) {
      const r = await fetchImpl(process.env.FEEDBACK_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, text: lines.join("\n") + (attachment ? "\n(zrzut ekranu w panelu zarządu)" : "") }) });
      if (r.ok) return "webhook";
    }
  } catch (e) { console.error("feedback notify:", e.message); }
  return null;
}
