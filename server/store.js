// Pamięć spraw (lekki zamiennik CRM), kolejka akcji do zatwierdzenia i logi. Zapis do plików JSON w data/.
// W produkcji: PostgreSQL (+pgvector), retencja logów, kopie zapasowe.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
fs.mkdirSync(DIR, { recursive: true });
const f = n => path.join(DIR, n + ".json");
const read = n => fs.existsSync(f(n)) ? JSON.parse(fs.readFileSync(f(n), "utf8")) : [];
const write = (n, v) => fs.writeFileSync(f(n), JSON.stringify(v, null, 2));

let pending = [];
export const store = {
  log(entry) { const l = read("logs"); l.push({ ts: new Date().toISOString(), ...entry }); write("logs", l.slice(-500)); },
  logs() { return read("logs").slice().reverse().slice(0, 100); },
  addPending(a) { const p = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, status: "pending", ...a }; pending.push(p); return p; },
  pendingFor(user) { return pending.filter(p => p.userId === user.id); },
  takePending(id, user) { const i = pending.findIndex(p => p.id === id && p.userId === user.id); if (i < 0) return null; return pending.splice(i, 1)[0]; },
  addCase(c) { const l = read("cases"); l.unshift({ id: Date.now(), ...c }); write("cases", l); },
  cases(depts) { return read("cases").filter(c => depts.includes(c.dept)); }
};
