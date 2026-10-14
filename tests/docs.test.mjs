// Dokumenty dodawane w aplikacji i szyfrowanie danych na dysku. Osobny plik, bo DATA_KEY musi być ustawiony przed startem.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "compax-docs-"));
process.env.DATA_KEY = "a".repeat(64);
process.env.AI_PROVIDER = "mock";
delete process.env.ANTHROPIC_API_KEY; delete process.env.OPENAI_API_KEY; delete process.env.OLLAMA_URL;

const { app } = await import("../server/app.js");
let server, base;
before(async () => { await new Promise(r => { server = app.listen(0, "127.0.0.1", r); }); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true }); });

const HDR = { "content-type": "application/json", "x-requested-with": "compax" };
const call = async (p, { method = "GET", body, cookie } = {}) => { const r = await fetch(base + p, { method, headers: { ...HDR, ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, json: await r.json().catch(() => null), headers: r.headers }; };
const login = async (id, pw) => { const r = await call("/api/login", { method: "POST", body: { userId: id, password: pw } }); return (r.headers.get("set-cookie") || "").split(";")[0]; };

const DOC = "# Rabaty sezonowe\n\n## Promocja zimowa\nW styczniu i lutym serwis agregatów chłodniczych ma rabat 15 procent dla stałych klientów.";

test("dokument: pracownik dodaje do swojego działu, działa w wyszukiwaniu tylko w tym dziale, usuwa autor", async () => {
  const anna = await login("a.lis", "anna-kriomar-2026"), marek = await login("m.wojcik", "marek-kriomar-2026");
  assert.equal((await call("/api/documents", { method: "POST", cookie: anna, body: { name: "Rabaty sezonowe.md", content: DOC } })).status, 200);
  const hit = await call("/api/chat", { method: "POST", cookie: anna, body: { message: "Jaki jest rabat w promocji zimowej na serwis agregatów?" } });
  assert.ok(hit.json.sources.some(s => s.file === "sprzedaz/rabaty-sezonowe.md"));
  const other = await call("/api/chat", { method: "POST", cookie: marek, body: { message: "Jaki jest rabat w promocji zimowej na serwis agregatów?" } });
  assert.ok(!other.json.sources.some(s => s.file === "sprzedaz/rabaty-sezonowe.md"), "inny dział nie widzi dokumentu sprzedaży");
  assert.equal((await call("/api/documents/sprzedaz/rabaty-sezonowe.md", { method: "DELETE", cookie: marek })).status, 404);
  assert.equal((await call("/api/documents/sprzedaz/rabaty-sezonowe.md", { method: "DELETE", cookie: anna })).status, 200);
  assert.ok(!(await call("/api/knowledge", { cookie: anna })).json.files.includes("sprzedaz/rabaty-sezonowe.md"));
});

test("dokument: nie do cudzego działu, tylko .md/.txt, limit rozmiaru; zarząd do dowolnego działu", async () => {
  const anna = await login("a.lis", "anna-kriomar-2026"), prezes = await login("j.zielinski", "prezes-kriomar-2026");
  assert.equal((await call("/api/documents", { method: "POST", cookie: anna, body: { name: "x.md", content: "tekst", dept: "ksiegowosc" } })).status, 403);
  assert.equal((await call("/api/documents", { method: "POST", cookie: anna, body: { name: "x.exe", content: "tekst" } })).status, 400);
  assert.equal((await call("/api/documents", { method: "POST", cookie: anna, body: { name: "duzy.md", content: "a".repeat(210 * 1024) } })).status, 400);
  assert.equal((await call("/api/documents", { method: "POST", cookie: prezes, body: { name: "zasady.md", content: "## Zasada\nTreść.", dept: "ksiegowosc" } })).status, 200);
});

test("szyfrowanie: pliki w data/ nie zawierają jawnego tekstu", async () => {
  const anna = await login("a.lis", "anna-kriomar-2026");
  await call("/api/documents", { method: "POST", cookie: anna, body: { name: "tajne.md", content: "## Tajny cennik\nKlient Bałtyk Market płaci 290 zł." } });
  const raw = fs.readFileSync(path.join(process.env.DATA_DIR, "docs.json"), "utf8");
  assert.ok(raw.startsWith("ENC1:"));
  assert.ok(!raw.includes("Bałtyk") && !raw.includes("290"));
  const logs = fs.readFileSync(path.join(process.env.DATA_DIR, "logs.json"), "utf8");
  assert.ok(logs.startsWith("ENC1:") && !logs.includes("a.lis") && !logs.includes("anna"));
});
