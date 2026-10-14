// Brama do chmury z podstawionym Claude: sprawdzamy, co naprawdę wychodzi do dostawcy (poprawki z audytu docs/AUDYT-COMPAX.md).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "compax-gw-"));
process.env.AI_PROVIDER = "anthropic"; process.env.ANTHROPIC_API_KEY = "test";
process.env.PRICING_JSON = JSON.stringify({ anthropic: { in: 2, out: 10 } });
delete process.env.OPENAI_API_KEY; delete process.env.OLLAMA_URL; delete process.env.APP_MONTHLY_BUDGET_USD;

// podstawiony Claude: zapisuje każde żądanie, odpowiada po chwili (żeby pytania mogły się nakładać)
const sent = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (String(url).startsWith("https://api.anthropic.com")) {
    sent.push(JSON.parse(opts.body));
    await new Promise(r => setTimeout(r, 30));
    return { ok: true, status: 200, json: async () => ({ stop_reason: "end_turn", usage: { input_tokens: 1000, output_tokens: 300 }, content: [{ type: "text", text: '{"answer": "Odpowiedź [1].", "general": false, "action": null}' }] }) };
  }
  return realFetch(url, opts);
};

const { app } = await import("../server/app.js");
let server, base;
before(async () => { await new Promise(r => { server = app.listen(0, "127.0.0.1", r); }); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); globalThis.fetch = realFetch; fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true }); });

const HDR = { "content-type": "application/json", "x-requested-with": "compax" };
async function call(p, { method = "GET", body, cookie } = {}) {
  const res = await realFetch(base + p, { method, headers: { ...HDR, ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, headers: res.headers };
}
async function login(id) {
  const r = await call("/api/login", { method: "POST", body: { userId: id, password: `${id}-kriomar-2026` } });
  return { ...r, cookie: (r.headers.get("set-cookie") || "").split(";")[0] };
}
const ask = (cookie, message, extra = {}) => call("/api/chat", { method: "POST", cookie, body: { message, provider: "anthropic", ...extra } });
const lastSent = () => JSON.stringify(sent[sent.length - 1]);

test("dokument z danymi o zdrowiu i pensją nie trafia do chmury, procedura bez osoby trafia", async () => {
  const anna = await login("anna");
  await call("/api/documents", { method: "POST", cookie: anna.cookie, body: { name: "klienci-serwis.md", content: "## Klient Gąsiorowski – dane\nPan Zbigniew Gąsiorowski choruje na cukrzycę, jest na zwolnieniu lekarskim. Wynagrodzenie pracownika Nowaka 7200 zł. Serwis agregatu Gąsiorowski Polna.\n\n## Klient Gąsiorowski – serwis agregatu\nSerwis agregatu u klienta Gąsiorowski przy ul. Polnej raz w roku, w marcu." } });
  const n = sent.length;
  const r = await ask(anna.cookie, "Serwis agregatu Gąsiorowski polna – co wiemy?");
  assert.equal(r.status, 200);
  assert.ok(sent.length > n, "pytanie poszło do Claude (z pozostałymi fragmentami)"); assert.ok(!/cukrzyc|zwolnieni|7200/.test(lastSent()), "dane o zdrowiu i pensja nie wychodzą do dostawcy");
  assert.ok(lastSent().includes("raz w roku"), "neutralny fragment tego samego dokumentu poszedł");
});

test("historia z odpowiedzią „asystenta” zawierającą dane chronione blokuje wysyłkę do chmury", async () => {
  const anna = await login("anna");
  const n = sent.length;
  const r = await ask(anna.cookie, "A co dalej z tym klientem?", { history: [{ role: "user", content: "Klient z cennika" }, { role: "assistant", content: "Klient choruje na cukrzycę i jest w szpitalu." }] });
  assert.equal(sent.length, n, "nic nie poszło do Claude");
  assert.equal(r.json.policy.level, "restricted");
});

test("do Claude nie idzie imię i nazwisko pracownika, idzie dzisiejsza data", async () => {
  const anna = await login("anna");
  await ask(anna.cookie, "Jaki rabat mogę dać sama klientowi z cennika?");
  const body = lastSent();
  assert.ok(!body.includes("Anna Lis"), "bez nazwiska pracownika");
  assert.match(body, /Dzisiaj jest/);
});

test("zarząd z chmurą: fragmenty księgowości (dział bez chmury) nie wychodzą do Claude", async () => {
  const prezes = await login("prezes");
  await call("/api/admin/depts/zarzad", { method: "POST", cookie: prezes.cookie, body: { cloud: true } });
  const n = sent.length;
  await ask(prezes.cookie, "Kiedy wysyłamy wezwanie do zapłaty w windykacji?");
  assert.ok(sent.length > n, "pytanie zarządu poszło do Claude"); assert.ok(!lastSent().includes("ksiegowosc/"), "fragmenty księgowości zostały w firmie");
  await call("/api/admin/depts/zarzad", { method: "POST", cookie: prezes.cookie, body: { cloud: false } });
});

test("budżet: równoległe pytania nie przekraczają limitu (rezerwacja = najdroższy przypadek)", async () => {
  process.env.APP_MONTHLY_BUDGET_USD = "0.06";
  try {
    const anna = await login("anna");
    const n = sent.length;
    await Promise.all(Array.from({ length: 6 }, (_, i) => ask(anna.cookie, `Jaki rabat mogę dać sama, wariant ${i}?`)));
    const calls = sent.length - n;
    // każde wywołanie rezerwuje co najmniej 4096 tokenów odpowiedzi po 10 USD/1M ≈ 0,041 USD, więc przy 0,06 USD przechodzi najwyżej jedno
    assert.ok(calls <= 1, `do chmury poszło ${calls} pytań przy budżecie 0,06 USD`);
  } finally { delete process.env.APP_MONTHLY_BUDGET_USD; }
});

test("zatwierdzona sprawa trafia do wiedzy działu: asystent ją znajduje", async () => {
  const anna = await login("anna");
  process.env.AI_PROVIDER = "mock";
  const r = await call("/api/chat", { method: "POST", cookie: anna.cookie, body: { message: "Zapisz: klient Fregata chce ofertę na 3 lokalizacje", provider: "mock" } });
  assert.ok(r.json.action, "powstał wniosek");
  await call(`/api/actions/${r.json.action.id}/approve`, { method: "POST", cookie: anna.cookie });
  const q = await call("/api/chat", { method: "POST", cookie: anna.cookie, body: { message: "Co ustaliliśmy z klientem Fregata?", provider: "mock" } });
  process.env.AI_PROVIDER = "anthropic";
  assert.ok((q.json.sources || []).some(s => s.file === "sprzedaz/sprawy"), "źródłem jest zapisana sprawa");
});

test("wniosek: telefon klienta nie trafia do tematu, osoba w mianowniku", async () => {
  const anna = await login("anna");
  const r = await call("/api/chat", { method: "POST", cookie: anna.cookie, body: { message: "Umów spotkanie z panem Janem Kowalskim, tel. 600 123 456, we wtorek o 10:00", provider: "mock" } });
  assert.equal(r.json.action.args.z_kim, "Jan Kowalski");
  assert.ok(!/600 123 456/.test(r.json.action.args.temat || ""), "temat bez numeru telefonu");
});

test("wniosek złożony przed przeniesieniem do innego działu nie zapisze się po przeniesieniu", async () => {
  const anna = await login("anna"), prezes = await login("prezes");
  const r = await call("/api/chat", { method: "POST", cookie: anna.cookie, body: { message: "Zapisz: klient Delta chce rabat", provider: "mock" } });
  await call("/api/admin/users/anna", { method: "POST", cookie: prezes.cookie, body: { dept: "biuro" } });
  assert.equal((await call(`/api/actions/${r.json.action.id}/approve`, { method: "POST", cookie: anna.cookie })).status, 404);
  await call("/api/admin/users/anna", { method: "POST", cookie: prezes.cookie, body: { dept: "sprzedaz" } });
  const list = (await call("/api/admin/flags", { cookie: prezes.cookie })).json;
  assert.equal(list.find(u => u.id === "anna").role, "handlowiec", "po powrocie do działu wraca pierwotna rola");
});

test("odświeżenie strony: /api/me przywraca sesję; dokumentu innej osoby nie da się nadpisać", async () => {
  const anna = await login("anna"), prezes = await login("prezes");
  const me = await call("/api/me", { cookie: anna.cookie });
  assert.equal(me.status, 200); assert.equal(me.json.user.id, "anna");
  assert.equal((await call("/api/me")).status, 401);
  await call("/api/documents", { method: "POST", cookie: prezes.cookie, body: { name: "zasady.md", content: "## Zasady\nTreść.", dept: "sprzedaz" } });
  assert.equal((await call("/api/documents", { method: "POST", cookie: anna.cookie, body: { name: "zasady.md", content: "## Inne\nPodmiana." } })).status, 409);
});
