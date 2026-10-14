// Wysyłka zgłoszenia do opiekuna: e-mail przez Resend, gdy skonfigurowany; bez konfiguracji tylko zapis.
import { test } from "node:test";
import assert from "node:assert/strict";
import { notifyFeedback } from "../server/feedback.js";

const item = { id: "Z-ABC123", ts: "2026-10-14T18:00:00Z", type: "problem", text: "Nie działa <b>przycisk</b>", userName: "Anna Lis", deptName: "Sprzedaż", context: { tab: "Czat" } };

test("zgłoszenie: bez konfiguracji nic nie jest wysyłane", async () => {
  delete process.env.RESEND_API_KEY; delete process.env.FEEDBACK_TO; delete process.env.FEEDBACK_WEBHOOK;
  let called = false;
  assert.equal(await notifyFeedback(item, { fetchImpl: async () => { called = true; return { ok: true }; } }), null);
  assert.equal(called, false);
});

test("zgłoszenie: e-mail przez Resend do opiekuna, treść HTML escapowana", async () => {
  process.env.RESEND_API_KEY = "re_test"; process.env.FEEDBACK_TO = "dev@example.com";
  let req;
  const via = await notifyFeedback(item, { fetchImpl: async (url, opts) => { req = { url, ...opts, body: JSON.parse(opts.body) }; return { ok: true }; } });
  assert.equal(via, "email");
  assert.equal(req.url, "https://api.resend.com/emails");
  assert.equal(req.headers.Authorization, "Bearer re_test");
  assert.deepEqual(req.body.to, ["dev@example.com"]);
  assert.match(req.body.subject, /^\[Compax\] Problem: /);
  assert.ok(req.body.html.includes("&lt;b&gt;przycisk&lt;/b&gt;") && !req.body.html.includes("<b>przycisk"));
  delete process.env.RESEND_API_KEY; delete process.env.FEEDBACK_TO;
});
