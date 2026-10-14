// Test dymny działającej instalacji: przechodzi wszystkie funkcje agenta przez API, tak jak pracownik w przeglądarce.
// Użycie:  BASE_URL=https://compax.tech npm run smoke          (domyślnie tryb pokazowy, bez kosztów)
//          BASE_URL=... SMOKE_PROVIDER=anthropic npm run smoke   (jedno pytanie przez prawdziwy model)
// Hasła kont demo czytane ze zmiennych SMOKE_PASS_ANNA / _TOMASZ / _JAN, a jeśli ich nie ma, z wartości demo.
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const PROVIDER = process.env.SMOKE_PROVIDER || "mock";
const PASS = {
  anna: process.env.SMOKE_PASS_ANNA || "anna-kriomar-2026",
  tomasz: process.env.SMOKE_PASS_TOMASZ || "tomasz-kriomar-2026",
  jan: process.env.SMOKE_PASS_JAN || "prezes-kriomar-2026"
};

let failed = 0, passed = 0;
const check = (name, ok, extra = "") => { ok ? passed++ : failed++; console.log(`${ok ? "OK  " : "FAIL"} ${name}${!ok && extra ? "  -> " + extra : ""}`); };

function client() {
  let cookie = "";
  const call = async (method, path, body, headers = { "X-Requested-With": "compax" }) => {
    const r = await fetch(BASE + path, { method, redirect: "manual", headers: { ...headers, ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get("set-cookie"); if (sc) cookie = sc.split(";")[0];
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
    return { status: r.status, headers: r.headers, json, text };
  };
  return { call, login: (id, pw) => call("POST", "/api/login", { userId: id, password: pw }), chat: (message, provider = PROVIDER, history = []) => call("POST", "/api/chat", { message, history, provider }) };
}

console.log(`Compax smoke test: ${BASE} (model: ${PROVIDER})\n`);

// 1. Strony i nagłówki bezpieczeństwa
const anon = client();
for (const p of ["/", "/app", "/prywatnosc"]) check(`strona ${p} odpowiada 200`, (await anon.call("GET", p, null, {})).status === 200);
check("stary adres /app.html przekierowuje na /app", (await anon.call("GET", "/app.html", null, {})).status === 301);
const h = (await anon.call("GET", "/app", null, {})).headers;
check("CSP bez unsafe-inline w skryptach", /script-src 'self'/.test(h.get("content-security-policy") || "") && !/script-src[^;]*unsafe-inline/.test(h.get("content-security-policy") || ""));
check("nagłówki: nosniff i brak osadzania w ramkach", h.get("x-content-type-options") === "nosniff" && /frame-ancestors 'none'|DENY/i.test((h.get("content-security-policy") || "") + (h.get("x-frame-options") || "")));
if (BASE.startsWith("https")) check("HSTS na HTTPS", !!h.get("strict-transport-security"));
check("API bez logowania: 401", (await anon.call("GET", "/api/cases")).status === 401);
check("lista pracowników niedostępna bez logowania", !((await anon.call("GET", "/api/meta")).json?.users || []).length);
check("żądanie bez nagłówka CSRF odrzucone", (await anon.call("POST", "/api/login", { userId: "a.lis", password: "x" }, {})).status === 400);

// 2. Logowanie
const bad = client();
const wrong = await bad.login("a.lis", "zle-haslo");
const ghost = await bad.login("nie.ma.takiego", "zle-haslo");
check("złe hasło i nieznany login: ten sam 401 i komunikat", wrong.status === 401 && ghost.status === 401 && wrong.json?.error === ghost.json?.error);
const anna = client(), tomasz = client(), jan = client();
const la = await anna.login("a.lis", PASS.anna);
check("logowanie Anny (sprzedaż)", la.status === 200 && la.json?.user?.dept === "sprzedaz");
check("sesja w ciasteczku HttpOnly, bez tokenu w treści odpowiedzi", !JSON.stringify(la.json).match(/token/i));
check("logowanie Tomasza (księgowość)", (await tomasz.login("t.kaczmarek", PASS.tomasz)).status === 200);
check("logowanie Jana (zarząd)", (await jan.login("j.zielinski", PASS.jan)).status === 200);

// 3. Wiedza działu i uprawnienia
const rabat = await anna.chat("Jaki rabat mogę dać sam?");
check("odpowiedź z dokumentów działu, ze źródłem", rabat.status === 200 && (rabat.json?.sources || []).some(s => s.file.startsWith("sprzedaz/")), JSON.stringify(rabat.json?.sources));
const cudze = await anna.chat("Kiedy wysyłamy pierwsze przypomnienie o płatności?");
check("sprzedaż nie dostaje dokumentów księgowości", cudze.status === 200 && !(cudze.json?.sources || []).some(s => s.file.startsWith("ksiegowosc/")));
const kbA = (await anna.call("GET", "/api/knowledge")).json, kbJ = (await jan.call("GET", "/api/knowledge")).json;
check("baza wiedzy: Anna nie widzi księgowości, zarząd widzi wszystko", !kbA.files.some(f => f.startsWith("ksiegowosc/")) && kbJ.files.some(f => f.startsWith("ksiegowosc/")));

// 4. Dane osobowe: zamazane przed modelem, prawdziwe u pracownika, wniosek czeka na człowieka
const spot = await anna.chat("Umów spotkanie z panem Janem Kowalskim, tel. 600 123 456, we wtorek o 10:00");
const prev = spot.json?.masked_preview || "";
check("do modelu nie idzie nazwisko ani telefon", spot.status === 200 && !/Kowalsk|600 123 456/.test(prev) && /OSOBA_1|TELEFON_1/.test(prev), prev);
check("asystent proponuje wniosek z prawdziwymi danymi", spot.json?.action?.tool === "umow_spotkanie" && /Kowalsk/.test(JSON.stringify(spot.json.action.args)), JSON.stringify(spot.json?.action));
check("wniosek: „z kim” bez „pan/panem”", !/^(z\s+)?pan/i.test(spot.json?.action?.args?.z_kim || ""), JSON.stringify(spot.json?.action?.args));
const pending = (await anna.call("GET", "/api/actions")).json || [];
const mine = pending.find(a => a.tool === "umow_spotkanie");
check("wniosek czeka w kolejce autora", !!mine);
check("inny pracownik nie może zatwierdzić cudzego wniosku", (await tomasz.call("POST", `/api/actions/${mine?.id}/approve`)).status === 404);
const appr = await anna.call("POST", `/api/actions/${mine?.id}/approve`);
check("zatwierdzenie tworzy sprawę", appr.status === 200 && ((await anna.call("GET", "/api/cases")).json || []).length > 0);
check("drugie zatwierdzenie tego samego wniosku nie działa", (await anna.call("POST", `/api/actions/${mine?.id}/approve`)).status === 404);
const note = await anna.chat("Zapisz: klient Fregata chce ofertę na 3 lokalizacje");
const nId = note.json?.action ? ((await anna.call("GET", "/api/actions")).json || [])[0]?.id : null;
check("drugi wniosek powstaje", !!nId, JSON.stringify(note.json?.action));
check("odrzucenie wniosku", nId && (await anna.call("POST", `/api/actions/${nId}/reject`)).status === 200);

// 5. Dane chronione nie wychodzą, nawet gdy pracownik sam wybierze chmurę
const pesel = await tomasz.chat("Zapisz: PESEL 85010112345 klienta do umowy");
check("księgowość: PESEL zatrzymany w firmie", pesel.json?.policy?.route === "blocked", JSON.stringify(pesel.json?.policy));
const peselCloud = await anna.chat("Klient podał PESEL 85010112345, sprawdź go", "anthropic");
check("sprzedaż z wybranym Claude: PESEL i tak zatrzymany", peselCloud.json?.policy?.route === "blocked", JSON.stringify(peselCloud.json?.policy));
const iban = await anna.chat("Przelej na konto PL61 1090 1014 0000 0712 1981 2874", "anthropic");
check("numer konta zatrzymany", iban.json?.policy?.route === "blocked");
const hist = await anna.chat("a co dalej?", "anthropic", [{ role: "user", content: "Pacjent ma cukrzycę, PESEL 85010112345" }, { role: "assistant", content: "Nie wysłałem." }]);
check("dane chronione we wcześniejszej wiadomości blokują dalszą rozmowę", hist.json?.policy?.route === "blocked");

// 6. Dokumenty działu
const up = await anna.call("POST", "/api/documents", { name: "smoke-test.md", content: "# Test\nProcedura testowa smoke: zielony parasol." });
check("Anna dodaje dokument do sprzedaży", up.status === 200, up.text);
check("Tomasz nie widzi dokumentu sprzedaży", !(((await tomasz.call("GET", "/api/knowledge")).json?.files) || []).includes("sprzedaz/smoke-test.md"));
check("Anna nie doda dokumentu do księgowości", (await anna.call("POST", "/api/documents", { name: "x.md", content: "x", dept: "ksiegowosc" })).status === 403);
check("plik inny niż .md/.txt odrzucony", (await anna.call("POST", "/api/documents", { name: "x.exe", content: "x" })).status === 400);
check("Anna usuwa swój dokument", (await anna.call("DELETE", "/api/documents/sprzedaz/smoke-test.md")).status === 200);

// 7. Dziennik i koszty tylko dla zarządu, bez danych osobowych
check("Anna nie widzi dziennika", (await anna.call("GET", "/api/logs")).status === 403);
const logs = await jan.call("GET", "/api/logs");
check("zarząd widzi dziennik", logs.status === 200 && Array.isArray(logs.json));
check("w dzienniku nie ma nazwisk, telefonów ani PESEL-u", !/Kowalsk|600 123 456|85010112345|PL61/.test(logs.text));
const usage = await jan.call("GET", "/api/usage");
check("zarząd widzi zużycie i budżet", usage.status === 200 && Array.isArray(usage.json?.depts));

// 8. Prawdziwy model (opcjonalnie)
if (PROVIDER !== "mock") {
  const r = await anna.chat("Jaki rabat może dać handlowiec bez zgody kierownika?", PROVIDER);
  check(`prawdziwy model (${PROVIDER}) odpowiada ze źródłem`, r.json?.policy?.route === "external" && /10/.test(r.json?.answer || ""), r.json?.answer);
}

// 9. Wylogowanie
await anna.call("POST", "/api/logout");
check("po wylogowaniu sesja nie działa", (await anna.call("GET", "/api/cases")).status === 401);
for (const c of [tomasz, jan]) await c.call("POST", "/api/logout");

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
