// Pamięć spraw (lekki zamiennik CRM), logi, liczniki, pamięć odpowiedzi i wgrane dokumenty. Zapis do plików w data/.
// Szyfrowanie na dysku: gdy ustawiony DATA_KEY (64 znaki hex = 256 bitów), każdy plik jest zapisywany jako AES-256-GCM
// (losowy wektor, znacznik integralności). Bez klucza pliki są zwykłym JSON-em (tryb lokalny i testy).
// W produkcji: PostgreSQL z szyfrowaniem, klucz w sejfie (KMS), automatyczne kopie.
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const DIR = process.env.DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data"); // DATA_DIR: osobny katalog np. w testach
fs.mkdirSync(DIR, { recursive: true });
const f = n => path.join(DIR, n + ".json");
const key = () => { const k = process.env.DATA_KEY; return k && /^[0-9a-f]{64}$/i.test(k) ? Buffer.from(k, "hex") : null; };
const MAGIC = "ENC1:";
function encrypt(text) {
  const k = key(); if (!k) return text;
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", k, iv);
  const data = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return MAGIC + Buffer.concat([iv, c.getAuthTag(), data]).toString("base64");
}
function decrypt(raw) {
  if (!raw.startsWith(MAGIC)) return raw; // stary, niezaszyfrowany plik: czytamy, przy następnym zapisie zostanie zaszyfrowany
  const k = key(); if (!k) throw new Error("plik zaszyfrowany, a brak DATA_KEY");
  const buf = Buffer.from(raw.slice(MAGIC.length), "base64");
  const d = crypto.createDecipheriv("aes-256-gcm", k, buf.subarray(0, 12)); d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
}
const read = n => {
  if (!fs.existsSync(f(n))) return [];
  try { return JSON.parse(decrypt(fs.readFileSync(f(n), "utf8"))); }
  catch (e) { console.error(`data/${n}.json nieczytelny (${e.message}), zaczynam od pustego`); return []; }
};
// zapis atomowy: najpierw plik tymczasowy, potem rename, żeby awaria w trakcie nie zostawiła połowy pliku
const write = (n, v) => { const tmp = f(n) + ".tmp"; fs.writeFileSync(tmp, encrypt(JSON.stringify(v)), { mode: 0o600 }); fs.renameSync(tmp, f(n)); };
export const encryptionOn = () => !!key();
const month = () => new Date().toISOString().slice(0, 7);

let pending = [];
export const store = {
  log(entry) { const l = read("logs"); l.push({ ts: new Date().toISOString(), ...entry }); write("logs", l.slice(-500)); },
  logs() { return read("logs").slice().reverse().slice(0, 100); },
  // Zużycie w bieżącym miesiącu (do limitów chmury i panelu kosztów zarządu)
  // Liczniki chmury w osobnym pliku, bo log jest obcinany do 500 wpisów i nie nadaje się do limitów miesięcznych
  recordCloud(dept, cost) { const m = month(); const u = read("usage").filter(x => x.month >= m); let e = u.find(x => x.month === m && x.dept === dept); if (!e) u.push(e = { month: m, dept, calls: 0, cost: 0 }); e.calls++; e.cost += cost || 0; write("usage", u); },
  spentThisMonthUsd() { const m = month(); return read("usage").filter(x => x.month === m).reduce((s, x) => s + x.cost, 0); },
  // Pamięć podręczna odpowiedzi (pytania bez danych osobowych i bez akcji); klucz zawiera dział i wersję bazy wiedzy
  cacheGet(key) { const e = read("cache").find(x => x.key === key && x.exp > Date.now()); return e ? e.value : null; },
  cachePut(key, value, ttlMs) { const c = read("cache").filter(x => x.exp > Date.now() && x.key !== key); c.push({ key, value, exp: Date.now() + ttlMs }); write("cache", c.slice(-500)); },
  cloudCallsThisMonth(dept) { const m = month(); return read("usage").filter(x => x.month === m && x.dept === dept).reduce((s, x) => s + x.calls, 0); },
  usageThisMonth() {
    const m = new Date().toISOString().slice(0, 7), by = {};
    for (const l of read("logs")) {
      if (!l.ts.startsWith(m) || l.event && l.event !== "blocked") continue;
      const u = by[l.dept] ||= { dept: l.dept, queries: 0, cloud: 0, local: 0, blocked: 0, tokens: 0, cost: 0, costKnown: true };
      u.queries++;
      if (l.event === "blocked") u.blocked++; else if (l.policy?.route === "external") u.cloud++; else if (l.policy?.route === "cache") u.cached = (u.cached || 0) + 1; else u.local++;
      u.tokens += (l.tokens_in || 0) + (l.tokens_out || 0);
      if (l.policy?.route === "external") { if (l.cost == null) u.costKnown = false; else u.cost += l.cost; }
    }
    return Object.values(by);
  },
  addPending(a) { const p = { ...a, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, status: "pending", at: new Date().toISOString() }; pending.push(p); return p; },
  pendingFor(user) { return pending.filter(p => p.userId === user.id); },
  takePending(id, user) { const i = pending.findIndex(p => p.id === id && p.userId === user.id); if (i < 0) return null; return pending.splice(i, 1)[0]; },
  // Dokumenty wgrane przez pracowników (baza wiedzy działu), zaszyfrowane jak reszta danych
  docs() { return read("docs"); },
  addDoc(d) { const l = read("docs").filter(x => !(x.dept === d.dept && x.file === d.file)); l.push(d); write("docs", l); },
  removeDoc(dept, file) { const l = read("docs"); const n = l.filter(x => !(x.dept === dept && x.file === file)); write("docs", n); return n.length !== l.length; },
  addCase(c) { const l = read("cases"); l.unshift({ id: Date.now(), ...c }); write("cases", l); },
  cases(depts) { return read("cases").filter(c => depts.includes(c.dept)); }
};
