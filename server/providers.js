// Wywołania dostawców modeli. Wybór dostawcy i modelu robi server/policy.js, przepływ jest w server/app.js.
//   mock      – bez klucza, odpowiedzi z bazy wiedzy (obsługiwane w index.js)
//   anthropic – Claude przez API (ANTHROPIC_API_KEY, domyślnie Haiku do prostych pytań i Sonnet do analiz)
//   openai    – OpenAI przez API (OPENAI_API_KEY, MODEL np. gpt-4o-mini)
//   ollama    – model lokalny (OLLAMA_URL, MODEL np. llama3.1) – dane nie opuszczają serwera

const SCHEMA_HINT = `Odpowiedz WYŁĄCZNIE poprawnym JSON: {"answer": "<tekst odpowiedzi>", "general": false, "action": null | {"tool": "<nazwa>", "args": {...}}}. Dostępne narzędzia: `;

function toolsText(tools) {
  return tools.map(t => `${t.name} (${t.title}) args: ${JSON.stringify(t.args)}`).join("; ");
}
function parse(text, usage = null) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { answer: text.trim(), action: null, usage };
  try { const j = JSON.parse(m[0]); return { answer: j.answer || "", general: j.general === true, action: j.action || null, usage }; }
  catch { return { answer: text.trim(), action: null, usage }; }
}

// Wyszukiwanie w internecie: narzędzie serwerowe Claude. Nowsza wersja (filtrowanie wyników) dla Sonnet/Opus, podstawowa dla Haiku.
export const webSearchTool = model => ({ type: /haiku/i.test(model || "") ? "web_search_20250305" : "web_search_20260209", name: "web_search", max_uses: 3 });
// Źródła z internetu: adresy cytowane w odpowiedzi, a gdy brak cytowań – pierwsze wyniki wyszukiwania
export function webSources(content) {
  const urls = new Map();
  for (const c of content) if (c.type === "text") for (const ct of c.citations || []) if (ct.url && !urls.has(ct.url)) urls.set(ct.url, ct.title || ct.url);
  if (!urls.size) for (const c of content) if (c.type === "web_search_tool_result" && Array.isArray(c.content)) for (const r of c.content.slice(0, 3)) if (r.url) urls.set(r.url, r.title || r.url);
  return [...urls].slice(0, 5).map(([url, title]) => ({ url, title }));
}
// Wywołania dostawców z limitem czasu i jednym ponowieniem przy przeciążeniu (429/529/5xx)
const TIMEOUT_MS = Number(process.env.MODEL_TIMEOUT_MS || 45000);
async function post(url, opts) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (attempt === 0 && (r.status === 429 || r.status >= 500)) { await new Promise(res => setTimeout(res, 1500)); continue; }
    return r;
  }
}
export async function callModel(provider, system, history, userMsg, tools, model = process.env.MODEL, { web = false } = {}) {
  const sys = system + "\n\n" + SCHEMA_HINT + toolsText(tools);
  const msgs = [...history.slice(-6).map(h => ({ role: h.role, content: h.content })), { role: "user", content: userMsg }];

  if (provider === "anthropic") {
    const r = await post("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      // max_tokens obejmuje też myślenie modelu, stąd zapas; effort "low" = krótkie, tanie odpowiedzi na pytania o procedury
      body: JSON.stringify({ model: model || "claude-sonnet-5-5", max_tokens: 4096, output_config: { effort: "low" }, system: sys, messages: msgs, ...(web ? { tools: [webSearchTool(model)] } : {}) })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    if (j.stop_reason === "refusal") return { answer: "Model odmówił odpowiedzi na to pytanie.", action: null, usage: j.usage };
    const out = parse(j.content.filter(c => c.type === "text").map(c => c.text).join(""), j.usage ? { input: j.usage.input_tokens, output: j.usage.output_tokens } : null);
    if (web) { out.web = webSources(j.content); out.webSearches = j.usage?.server_tool_use?.web_search_requests || 0; }
    return out;
  }

  if (provider === "openai") {
    const r = await post("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: model || "gpt-4o-mini", messages: [{ role: "system", content: sys }, ...msgs], response_format: { type: "json_object" } })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return parse(j.choices[0].message.content, j.usage ? { input: j.usage.prompt_tokens, output: j.usage.completion_tokens } : null);
  }

  if (provider === "ollama") {
    const r = await post(`${process.env.OLLAMA_URL || "http://localhost:11434"}/api/chat`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: model || "llama3.1", stream: false, format: "json", messages: [{ role: "system", content: sys }, ...msgs] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return parse(j.message?.content || "", j.prompt_eval_count != null ? { input: j.prompt_eval_count, output: j.eval_count || 0 } : null);
  }

  throw new Error(`Nieznany dostawca: ${provider}`);
}
