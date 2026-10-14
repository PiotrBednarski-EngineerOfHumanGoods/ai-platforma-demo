// Wyszukiwanie w internecie przez Claude: wersja narzędzia zależna od modelu, źródła z cytowań.
import { test } from "node:test";
import assert from "node:assert/strict";
import { callModel, webSearchTool, webSources } from "../server/providers.js";

test("narzędzie web_search: podstawowa wersja dla Haiku, nowsza dla Sonnet", () => {
  assert.equal(webSearchTool("claude-haiku-5-5").type, "web_search_20250305");
  assert.equal(webSearchTool("claude-sonnet-5-5").type, "web_search_20260209");
});

test("Claude z internetem: narzędzie w żądaniu, źródła z cytowań, liczba wyszukiwań", async () => {
  process.env.ANTHROPIC_API_KEY = "test";
  let body; const orig = globalThis.fetch;
  globalThis.fetch = async (url, opts) => { body = JSON.parse(opts.body); return { ok: true, json: async () => ({
    stop_reason: "end_turn", usage: { input_tokens: 100, output_tokens: 20, server_tool_use: { web_search_requests: 2 } },
    content: [
      { type: "server_tool_use", name: "web_search", input: { query: "stawka VAT na usługi serwisowe" } },
      { type: "web_search_tool_result", content: [{ type: "web_search_result", url: "https://www.gov.pl/a", title: "Gov A" }] },
      { type: "text", text: '{"answer": "Stawka to 23%.", "general": true, "action": null}', citations: [{ type: "web_search_result_location", url: "https://www.podatki.gov.pl/b", title: "Podatki B" }] }
    ] }) }; };
  try {
    const out = await callModel("anthropic", "sys", [], "Jaka jest stawka VAT?", [], "claude-haiku-5-5", { web: true });
    assert.equal(body.tools[0].type, "web_search_20250305");
    assert.equal(out.answer, "Stawka to 23%."); assert.equal(out.general, true);
    assert.deepEqual(out.web, [{ url: "https://www.podatki.gov.pl/b", title: "Podatki B" }]);
    assert.equal(out.webSearches, 2);
    await callModel("anthropic", "sys", [], "x", [], "claude-sonnet-5-5");
    assert.equal(body.tools, undefined, "bez uprawnienia: żadnego narzędzia");
  } finally { globalThis.fetch = orig; }
});

test("źródła bez cytowań: pierwsze wyniki wyszukiwania", () => {
  assert.deepEqual(webSources([{ type: "web_search_tool_result", content: [{ url: "https://x.pl", title: "X" }] }]), [{ url: "https://x.pl", title: "X" }]);
});
