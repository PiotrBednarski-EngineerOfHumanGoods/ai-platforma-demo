// Brama AI: jeden punkt dostępu do modeli. Zmiana dostawcy = zmiana AI_PROVIDER w .env.
//   mock      – bez klucza, odpowiedzi z bazy wiedzy (obsługiwane w index.js)
//   anthropic – Claude przez API (ANTHROPIC_API_KEY, MODEL np. claude-opus-5-5 lub tańszy claude-sonnet-5-5)
//   openai    – OpenAI przez API (OPENAI_API_KEY, MODEL np. gpt-4o-mini)
//   ollama    – model lokalny (OLLAMA_URL, MODEL np. llama3.1) – dane nie opuszczają serwera

const SCHEMA_HINT = `Odpowiedz WYŁĄCZNIE poprawnym JSON: {"answer": "<tekst odpowiedzi>", "action": null | {"tool": "<nazwa>", "args": {...}}}. Dostępne narzędzia: `;

function toolsText(tools) {
  return tools.map(t => `${t.name} (${t.title}) args: ${JSON.stringify(t.args)}`).join("; ");
}
function parse(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { answer: text.trim(), action: null };
  try { const j = JSON.parse(m[0]); return { answer: j.answer || "", action: j.action || null }; }
  catch { return { answer: text.trim(), action: null }; }
}

export async function callModel(provider, system, history, userMsg, tools) {
  const sys = system + "\n\n" + SCHEMA_HINT + toolsText(tools);
  const msgs = [...history.slice(-6).map(h => ({ role: h.role, content: h.content })), { role: "user", content: userMsg }];
  const model = process.env.MODEL;

  if (provider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: model || "claude-opus-5-5", max_tokens: 1024, system: sys, messages: msgs })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return parse(j.content.map(c => c.text || "").join(""));
  }

  if (provider === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: model || "gpt-4o-mini", messages: [{ role: "system", content: sys }, ...msgs], response_format: { type: "json_object" } })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return parse(j.choices[0].message.content);
  }

  if (provider === "ollama") {
    const r = await fetch(`${process.env.OLLAMA_URL || "http://localhost:11434"}/api/chat`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: model || "llama3.1", stream: false, format: "json", messages: [{ role: "system", content: sys }, ...msgs] })
    });
    const j = await r.json();
    return parse(j.message?.content || "");
  }

  throw new Error(`Nieznany dostawca: ${provider}`);
}
