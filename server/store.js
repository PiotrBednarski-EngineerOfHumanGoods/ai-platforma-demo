// Pamięć spraw (lekki zamiennik CRM), kolejka akcji do zatwierdzenia i logi. Zapis do plików JSON w data/.
// W produkcji: PostgreSQL (+pgvector), retencja logów, kopie zapasowe.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR = process.env.DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data"); // DATA_DIR: osobny katalog np. w testach
fs.mkdirSync(DIR, { recursive: true });
const f = n => path.join(DIR, n + ".json");
const read = n => {
  if (!fs.existsSync(f(n))) return [];
  try { return JSON.parse(fs.readFileSync(f(n), "utf8")); }
  catch (e) { console.error(`data/${n}.json uszkodzony, zaczynam od pustego:`, e.message); return []; }
};
// zapis atomowy: najpierw plik tymczasowy, potem rename, żeby awaria w trakcie nie zostawiła połowy pliku
const write = (n, v) => { const tmp = f(n) + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(v, null, 2)); fs.renameSync(tmp, f(n)); };
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
  addCase(c) { const l = read("cases"); l.unshift({ id: Date.now(), ...c }); write("cases", l); },
  cases(depts) { return read("cases").filter(c => depts.includes(c.dept)); }
};
