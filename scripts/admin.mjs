// Narzędzie administratora: prawa osób z RODO i zmiana klucza szyfrowania.
// Uruchamiaj na serwerze, w katalogu aplikacji, przy zatrzymanej aplikacji (pm2 stop ai-demo):
//   npm run admin -- szukaj "Kowalski"            gdzie są dane osoby (art. 15)
//   npm run admin -- eksport "Kowalski" plik.json  kopia spraw osoby dla wnioskodawcy (art. 15, 20)
//   npm run admin -- usun "Kowalski"               podgląd, co zostanie usunięte (art. 17)
//   npm run admin -- usun "Kowalski" --tak         usunięcie spraw i wpisów dziennika z tą frazą
//   NEW_DATA_KEY=<64 znaki hex> npm run admin -- nowy-klucz   przeszyfrowanie wszystkich plików nowym kluczem
// Klucz DATA_KEY czytany z .env (npm run admin ładuje go sam). Nic nie jest wysyłane poza serwer.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const DIR = process.env.DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
// wszystkie pliki danych (także uprawnienia i ustawienia z panelu zarządu): stała lista pomijała nowe pliki
const dataFiles = () => fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(n => n.endsWith(".json")).map(n => n.slice(0, -5)) : [];
const MAGIC = "ENC1:";
const asKey = k => (k && /^[0-9a-f]{64}$/i.test(k) ? Buffer.from(k, "hex") : null);

function decrypt(raw, key) {
  if (!raw.startsWith(MAGIC)) return raw;
  if (!key) throw new Error("plik zaszyfrowany, a brak DATA_KEY");
  const buf = Buffer.from(raw.slice(MAGIC.length), "base64");
  const d = crypto.createDecipheriv("aes-256-gcm", key, buf.subarray(0, 12)); d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
}
function encrypt(text, key) {
  if (!key) return text;
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return MAGIC + Buffer.concat([iv, c.getAuthTag(), data]).toString("base64");
}
const file = n => path.join(DIR, n + ".json");
const load = (n, key) => (fs.existsSync(file(n)) ? JSON.parse(decrypt(fs.readFileSync(file(n), "utf8"), key)) : null);
const save = (n, v, key) => { const tmp = file(n) + ".tmp"; fs.writeFileSync(tmp, encrypt(JSON.stringify(v), key), { mode: 0o600 }); fs.renameSync(tmp, file(n)); };

const [cmd, phrase, ...rest] = process.argv.slice(2);
const key = asKey(process.env.DATA_KEY);
const norm = s => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
// całe słowo: „Nowak” nie trafia w „Nowakowska”
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const has = (entry, q) => new RegExp(`(?<![a-z0-9])${esc(norm(q))}(?![a-z0-9])`).test(norm(JSON.stringify(entry)));
const fail = msg => { console.error(msg); process.exit(1); };

if (!cmd || cmd === "pomoc") {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 8).map(l => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(0);
}
if (process.env.DATA_KEY && !key) fail("DATA_KEY musi mieć 64 znaki szesnastkowe.");

if (["szukaj", "eksport", "usun"].includes(cmd)) {
  if (!phrase || phrase.trim().length < 3) fail("Podaj frazę (co najmniej 3 znaki), np. nazwisko albo numer telefonu.");
  const found = {};
  for (const n of ["cases", "logs", "docs", "feedback"]) found[n] = (load(n, key) || []).filter(e => has(e, phrase));
  if (cmd === "szukaj") {
    console.log(`Fraza „${phrase}”:`);
    console.log(`  sprawy:    ${found.cases.length}`); found.cases.forEach(c => console.log(`    - ${c.when?.slice(0, 10)} ${c.dept}: ${c.klient} | ${c.notatka}`));
    console.log(`  dokumenty: ${found.docs.length}`); found.docs.forEach(d => console.log(`    - ${d.dept}/${d.file} (dodał: ${d.by})`));
    console.log(`  dziennik:  ${found.logs.length}`); found.logs.forEach(l => console.log(`    - ${l.ts?.slice(0, 16)} ${l.dept}: ${l.event || "pytanie"}`));
    console.log(`  zgłoszenia: ${found.feedback.length}`); found.feedback.forEach(f => console.log(`    - ${f.id} ${f.ts?.slice(0, 10)}: ${String(f.text).slice(0, 60)}`));
    console.log("Pamięć odpowiedzi (cache) zawiera tylko pytania bez danych osobowych i wygasa po 7 dniach. Kopie zapasowe wygasają po 14 dniach.");
  } else if (cmd === "eksport") {
    const out = rest[0] || `eksport-${Date.now()}.json`;
    fs.writeFileSync(out, JSON.stringify({ fraza: phrase, data: new Date().toISOString(), sprawy: found.cases, dziennik: found.logs, zgloszenia: found.feedback.map(({ screenshot, ...f }) => f), dokumenty: found.docs.map(d => ({ dzial: d.dept, plik: d.file, dodano: d.at })) }, null, 2), { mode: 0o600 });
    console.log(`Zapisano ${found.cases.length} spraw, ${found.logs.length} wpisów dziennika, ${found.feedback.length} zgłoszeń i ${found.docs.length} dokumentów do ${out} (plik jawny: przekaż bezpiecznym kanałem i usuń).`);
  } else {
    const yes = rest.includes("--tak");
    console.log(`${yes ? "Usuwam" : "Do usunięcia (podgląd, dodaj --tak, aby usunąć)"}: ${found.cases.length} spraw, ${found.logs.length} wpisów dziennika, ${found.feedback.length} zgłoszeń (ze zrzutami), wpisy pamięci odpowiedzi z tą frazą.`);
    console.log("Kopie zapasowe wygasają po 14 dniach. Dane wysłane wcześniej do dostawcy modelu (po maskowaniu) usuwa się zgodnie z jego umową.");
    if (found.docs.length) console.log(`Uwaga: fraza występuje też w ${found.docs.length} dokumentach działu; dokumenty usuwa się w aplikacji, po decyzji właściciela procedury.`);
    if (yes) {
      for (const f of found.feedback) if (f.screenshot) { try { fs.unlinkSync(path.join(DIR, "blobs", f.screenshot.file)); } catch {} } // zrzuty ekranu usuwanych zgłoszeń
      for (const n of ["cases", "logs", "feedback", "cache"]) { const all = load(n, key); if (all) save(n, all.filter(e => !has(e, phrase)), key); }
      console.log("Gotowe. Uruchom aplikację ponownie (pm2 start ai-demo).");
    }
  }
} else if (cmd === "nowy-klucz") {
  const next = asKey(process.env.NEW_DATA_KEY);
  if (!next) fail("Ustaw NEW_DATA_KEY (64 znaki hex), np.: NEW_DATA_KEY=$(openssl rand -hex 32)");
  const plain = {};
  for (const n of dataFiles()) { const v = load(n, key); if (v !== null) plain[n] = v; } // najpierw odczyt wszystkiego starym kluczem: błąd przerywa przed zmianami
  for (const [n, v] of Object.entries(plain)) save(n, v, next);
  for (const [n, v] of Object.entries(plain)) if (JSON.stringify(load(n, next)) !== JSON.stringify(v)) fail(`Weryfikacja ${n}.json nie powiodła się. Przywróć kopię zapasową.`);
  // zrzuty ekranu ze zgłoszeń (data/blobs): ten sam schemat, odczyt starym kluczem, zapis nowym, weryfikacja
  const bdir = path.join(DIR, "blobs");
  if (fs.existsSync(bdir)) for (const name of fs.readdirSync(bdir).filter(n => !n.endsWith(".tmp"))) {
    const p = path.join(bdir, name), plainB = decrypt(fs.readFileSync(p, "utf8"), key);
    fs.writeFileSync(p + ".tmp", encrypt(plainB, next), { mode: 0o600 }); fs.renameSync(p + ".tmp", p);
    if (decrypt(fs.readFileSync(p, "utf8"), next) !== plainB) fail(`Weryfikacja zrzutu ${name} nie powiodła się.`);
  }
  console.log(`Przeszyfrowano ${Object.keys(plain).length} plików. Teraz wpisz nowy klucz do .env jako DATA_KEY i uruchom aplikację.`);
} else fail(`Nieznane polecenie: ${cmd}. Pomoc: npm run admin`);
