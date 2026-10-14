// Wywołania dostawców modeli. Wybór dostawcy i modelu robi server/policy.js, przepływ jest w server/app.js.
//   mock      – bez klucza, odpowiedzi z bazy wiedzy (obsługiwane w index.js)
//   anthropic – Claude przez API (ANTHROPIC_API_KEY, MODEL np. claude-opus-5-5 lub tańszy claude-sonnet-5-5)
//   openai    – OpenAI przez API (OPENAI_API_KEY, MODEL np. gpt-4o-mini)
//   ollama    – model lokalny (OLLAMA_URL, MODEL np. llama3.1) – dane nie opuszczają serwera

const SCHEMA_HINT = `Odpowiedz WYŁĄCZNIE poprawnym JSON: {"answer": "<tekst odpowiedzi>", "action": null | {"tool": "<nazwa>", "args": {...}}}. Dostępne narzędzia: `;

function toolsText(tools) {
  return tools.map(t => `${t.name} (${t.title}) args: ${JSON.stringify(t.args)}`).join("; ");
}
function parse(text, usage = null) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { answer: text.trim(), action: null, usage };
  try { const j = JSON.parse(m[0]); return { answer: j.answer || "", action: j.action || null, usage }; }
  catch { return { answer: text.trim(), action: null, usage }; }
}

export async function callModel(provider, system, history, userMsg, tools, model = process.env.MODEL) {
  const sys = system + "\n\n" + SCHEMA_HINT + toolsText(tools);
  const msgs = [...history.slice(-6).map(h => ({ role: h.role, content: h.content })), { role: "user", content: userMsg }];

  if (provider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      // max_tokens obejmuje też myślenie modelu, stąd zapas; effort "low" = krótkie, tanie odpowiedzi na pytania o procedury
      body: JSON.stringify({ model: model || "claude-opus-5-5", max_tokens: 4096, output_config: { effort: "low" }, system: sys, messages: msgs })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    if (j.stop_reason === "refusal") return { answer: "Model odmówił odpowiedzi na to pytanie.", action: null, usage: j.usage };
    return parse(j.content.filter(c => c.type === "text").map(c => c.text).join(""), j.usage ? { input: j.usage.input_tokens, output: j.usage.output_tokens } : null);
  }

  if (provider === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: model || "gpt-4o-mini", messages: [{ role: "system", content: sys }, ...msgs], response_format: { type: "json_object" } })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return parse(j.choices[0].message.content, j.usage ? { input: j.usage.prompt_tokens, output: j.usage.completion_tokens } : null);
  }

  if (provider === "ollama") {
    const r = await fetch(`${process.env.OLLAMA_URL || "http://localhost:11434"}/api/chat`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: model || "llama3.1", stream: false, format: "json", messages: [{ role: "system", content: sys }, ...msgs] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return parse(j.message?.content || "", j.prompt_eval_count != null ? { input: j.prompt_eval_count, output: j.eval_count || 0 } : null);
  }

  throw new Error(`Nieznany dostawca: ${provider}`);
}
