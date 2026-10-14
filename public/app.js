const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const TIER = { cheap: "model podstawowy", strong: "model zaawansowany" };
const plural = (n, one, few, many) => n === 1 ? one : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? few : many;
const plDate = (iso, time = true) => new Date(iso).toLocaleString("pl-PL", time ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "numeric" });
const usd = n => !n ? "0 USD" : (n < 0.01 ? n.toFixed(4) : n.toFixed(2)) + " USD";
const ICON = {"mark":"<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\"><path d=\"M18.4 6.2A8.6 8.6 0 1 0 18.4 17.8\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\"></path><path d=\"M16.2 7.8L12.9 12.9L11.1 11.1Z\" fill=\"currentColor\"></path><path d=\"M7.8 16.2L11.1 11.1L12.9 12.9Z\" fill=\"currentColor\" opacity=\".5\"></path></svg>","bulb":"<svg width=\"14\" height=\"14\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"M10 2c3.31 0 6 2.6 6 5.8q-.01 2.53-2.2 4.6a1 1 0 0 0-.15.2l-.02.09-.94 3.92a1.8 1.8 0 0 1-1.67 1.38l-.15.01H9.13c-.82 0-1.54-.52-1.78-1.26l-.04-.14-.93-3.91a.6.6 0 0 0-.17-.3A6.3 6.3 0 0 1 4 8.04L4 7.8v-.2A5.9 5.9 0 0 1 10 2m2.05 13h-4.1l.32 1.33.03.1c.1.3.38.52.71.56l.12.01h1.81a.9.9 0 0 0 .75-.53l.03-.1zM10 3a4.9 4.9 0 0 0-4.98 4.41L5 7.63V8q.08 1.95 1.9 3.67.27.27.4.64l.05.15.37 1.54h4.57l.38-1.61.05-.16q.13-.32.39-.56Q15 9.87 15 7.8A4.9 4.9 0 0 0 10 3\" fill=\"currentColor\"></path></svg>","docx":"<svg width=\"14\" height=\"14\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"M6 2a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V7.41a1.5 1.5 0 0 0-.44-1.06l-3.91-3.91A1.5 1.5 0 0 0 10.59 2zm0 1h4v3.5A1.5 1.5 0 0 0 11.5 8H15v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1m5 .2L14.8 7h-3.3a.5.5 0 0 1-.5-.5z\" fill=\"currentColor\"></path></svg>","check":"<svg width=\"14\" height=\"14\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16m3.36 5.65a.5.5 0 0 0-.64-.06l-.07.06L9 11.3 7.35 9.65l-.07-.06a.5.5 0 0 0-.7.7l.07.07 2 2 .07.06c.17.11.4.11.56 0l.07-.06 4-4 .07-.08a.5.5 0 0 0-.06-.63\" fill=\"currentColor\"></path></svg>","emptyChat":"<svg width=\"40\" height=\"40\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M9.56 3a7.5 7.5 0 0 0-6.8 10.67l-.72 2.84c-.23.92.59 1.75 1.5 1.53l2.93-.7q1.44.64 3.1.66a7.5 7.5 0 0 0 0-15m-6 7.5a6 6 0 1 1 3.33 5.37l-.24-.12-.27.07-2.78.66.69-2.7.07-.28-.13-.25a6 6 0 0 1-.67-2.75m11 10.5a7.5 7.5 0 0 1-5.1-2 8 8 0 0 0 2.18-.26 6 6 0 0 0 5.6.13l.24-.12.26.07c.92.22 1.96.44 2.74.6-.18-.74-.41-1.75-.64-2.64l-.07-.28.13-.25a5.97 5.97 0 0 0-2.09-7.8 8 8 0 0 0-.8-2.04 7.5 7.5 0 0 1 4.35 10.26l.67 2.8c.2.9-.57 1.7-1.47 1.5-.72-.15-1.87-.39-2.91-.63q-1.43.64-3.09.66\" fill=\"currentColor\"></path></svg>","emptyCases":"<svg width=\"40\" height=\"40\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M13.75 2C14.99 2 16 3 16 4.25V6h2.75C20.55 6 22 7.46 22 9.25v8.5c0 1.8-1.46 3.25-3.25 3.25H5.25A3.25 3.25 0 0 1 2 17.75v-8.5C2 7.45 3.46 6 5.25 6H8V4.25C8 3.01 9 2 10.25 2zm6.75 11.49q-.76.5-1.75.51H14a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1H5.25q-.97-.02-1.75-.51v4.26c0 .97.78 1.75 1.75 1.75h13.5c.97 0 1.75-.78 1.75-1.75zM5.25 7.5c-.97 0-1.75.78-1.75 1.75v1.5c0 .97.78 1.75 1.75 1.75H10V12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v.5h4.75c.97 0 1.75-.78 1.75-1.75v-1.5c0-.97-.78-1.75-1.75-1.75zm5-4a.75.75 0 0 0-.75.75V6h5V4.25a.75.75 0 0 0-.75-.75z\" fill=\"currentColor\"></path></svg>","emptyKb":"<svg width=\"40\" height=\"40\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 19.14c-.5.53-1.21.86-2 .86H3.75C2.78 20 2 19.22 2 18.25V5.75C2 4.78 2.78 4 3.75 4H10c.79 0 1.5.33 2 .86.5-.53 1.21-.86 2-.86h6.25c.97 0 1.75.78 1.75 1.75v12.5c0 .97-.78 1.75-1.75 1.75H14c-.79 0-1.5-.33-2-.86M3.5 5.75v12.5c0 .14.11.25.25.25H10c.69 0 1.25-.56 1.25-1.25V6.75c0-.69-.56-1.25-1.25-1.25H3.75a.25.25 0 0 0-.25.25m9.25 11.5c0 .69.56 1.25 1.25 1.25h6.25q.23-.02.25-.25V5.75a.25.25 0 0 0-.25-.25H14c-.69 0-1.25.56-1.25 1.25z\" fill=\"currentColor\"></path></svg>","emptyLogs":"<svg width=\"40\" height=\"40\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 4.5a7.5 7.5 0 1 1-7.42 6.4c.07-.46-.26-.9-.72-.9-.37 0-.7.26-.76.62Q3 11.3 3 12a9 9 0 1 0 3-6.7V4.24a.75.75 0 0 0-1.5 0v3c0 .41.34.75.75.75h3a.75.75 0 0 0 0-1.5H6.9a7.5 7.5 0 0 1 5.1-2m.5 3.25a.75.75 0 0 0-1.5 0v4.5c0 .41.34.75.75.75h3a.75.75 0 0 0 0-1.5H12.5z\" fill=\"currentColor\"></path></svg>","info":"<svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16m0 10.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5M10 6a.5.5 0 0 0-.5.41v4.68a.5.5 0 0 0 1 0V6.41A.5.5 0 0 0 10 6\" fill=\"currentColor\"></path></svg>"};
let user = null, history = [], meta = null, pendingList = [];
const HDR = { "content-type": "application/json", "x-requested-with": "compax" };
const api = (p, o = {}) => fetch("/api" + p, { ...o, headers: { ...HDR, ...(o.headers || {}) } }).then(r => {
  if (r.status === 401 && user && p !== "/login") sessionExpired(); // wygasła sesja (np. restart serwera): wracamy do logowania
  return r.json();
});
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hhmm = iso => (iso ? new Date(iso) : new Date()).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
const TOK_NAMES = { OSOBA: "osoba", TELEFON: "telefon", EMAIL: "e-mail", NIP: "NIP", PESEL: "PESEL", KONTO: "nr konta", DOWOD: "dowód", KARTA: "karta" };
const tokens = s => esc(s).replace(/\[([A-Z]+)_(\d+)\]/g, (_, k, n) => `<span class="tok">${TOK_NAMES[k] || k.toLowerCase()} ${n}</span>`);
const tokTypes = s => [...new Set((String(s).match(/\[([A-Z]+)_\d+\]/g) || []).map(t => TOK_NAMES[t.slice(1, t.indexOf("_"))] || t))];
const TITLES = { umow_spotkanie: "Umów spotkanie", zapisz_sprawe: "Zapisz sprawę", przypomnienie_platnosc: "Wyślij przypomnienie o płatności" };
const ARG_NAMES = { z_kim: "z kim", kiedy: "kiedy", temat: "temat", klient: "klient", notatka: "notatka", nastepny_krok: "następny krok", termin: "termin", kontrahent: "kontrahent", faktura: "faktura", kwota: "kwota" };
const shortId = id => "W-" + String(id).slice(-5).toUpperCase();
const isPhone = () => matchMedia("(max-width:900px)").matches;

const EXAMPLES = {
  sprzedaz: ["Ile kosztuje przegląd klimatyzacji?", "Jaki rabat mogę dać sam?", "Umów spotkanie z firmą Bałtyk Market we wtorek 10:00", "Zapisz: klient Fregata chce ofertę na 3 lokalizacje", "Kiedy wysyłamy wezwanie do zapłaty? (pytanie z księgowości)"],
  obsluga: ["Klient bez umowy zgłasza awarię – w jakim czasie przyjedziemy?", "Jakie mamy statusy zlecenia?", "Ile mamy czasu na odpowiedź na reklamację?", "Zapisz: Jan Kowalski tel. 600 123 456 zgłasza awarię chłodni w Sopocie"],
  biuro: ["Jak zarezerwować salę?", "Kiedy składa się zamówienia biurowe?", "Umów spotkanie z panią Martą Zielińską jutro o 12:00", "Jak rozliczyć delegację?"],
  ksiegowosc: ["Kiedy wysyłamy pierwsze przypomnienie o płatności?", "Kto akceptuje korektę powyżej 5000 zł?", "Wyślij przypomnienie o płatności do firmy Delta Sp. z o.o. FV 123/2026 na 4 200 zł", "Zapisz: PESEL 90010112345 klienta do umowy (dane chronione)", "Jaki rabat może dać handlowiec? (pytanie ze sprzedaży)"],
  zarzad: ["Jakie mamy cele na 2026?", "Co zawiera raport tygodniowy?", "Jaki rabat może dać handlowiec?", "Kiedy wysyłamy wezwanie do zapłaty?"]
};

/* ---------- logowanie ---------- */
async function init() {
  meta = await fetch("/api/meta").then(r => r.json());
  $("#loginForm").onsubmit = e => { e.preventDefault(); login($("#login-id").value, $("#pw").value); };
  [...document.querySelectorAll("#accounts button")].forEach(b => b.onclick = () => { $("#login-id").value = b.dataset.login; $("#pw").value = b.dataset.pw; loginError(""); $("#loginBtn").focus(); });
  if (matchMedia("(pointer:fine)").matches) $("#login-id").focus(); // na telefonie bez automatycznej klawiatury
}
function sessionExpired() {
  user = null; history = [];
  document.getElementById("report")?.close?.();
  $("#app").hidden = true; $("#login").hidden = false;
  loginError("Sesja wygasła. Zaloguj się ponownie.");
  $("#login-id").focus();
}
function loginError(msg) { const b = $("#loginErr"); b.querySelector("span").textContent = msg; b.classList.toggle("on", !!msg); $$("#loginForm .input").forEach(i => i.toggleAttribute("aria-invalid", !!msg)); $$("#loginForm .input").forEach(i => i.classList.toggle("is-invalid", !!msg)); }
async function login(id, password) {
  loginError("");
  const mark = document.querySelector(".brand-mark"), btn = $("#loginBtn");
  mark.classList.add("spinning"); btn.disabled = true; btn.textContent = "Logowanie…";
  const minWait = new Promise(r => setTimeout(r, 900));
  const done = () => { mark.classList.remove("spinning"); btn.disabled = false; btn.textContent = "Zaloguj się"; };
  const [r] = await Promise.all([fetch("/api/login", { method: "POST", headers: HDR, body: JSON.stringify({ userId: id, password }) }).then(r => r.json()).catch(() => ({ error: "Brak połączenia z serwerem. Spróbuj ponownie." })), minWait]);
  done();
  if (r.error) return loginError(r.error);
  $("#pw").value = "";
  user = r.user; history = []; user.flags = r.flags || {};
  meta = await fetch("/api/meta").then(x => x.json()).catch(() => meta); // po zalogowaniu: z listą pracowników (imiona w dzienniku)
  $("#login").hidden = true; $("#app").hidden = false;
  $("#who").textContent = user.name; $("#whoDept").textContent = `${meta.depts[user.dept]} · ${user.role}`;
  $("#av").textContent = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  $("#logsTab").hidden = $("#bnLogs").hidden = user.dept !== "zarzad";
  // dostawcy AI dozwoleni dla działu (ustawia administrator); pracownik wybiera tylko spośród nich
  const allowed = (r.providers || []).map(id => meta.providers.find(p => p.id === id)).filter(Boolean);
  renderModelPicker(allowed);
  $("#chat").innerHTML = `<div class="empty">${ICON.emptyChat}<span class="empty-title">Dzień dobry, ${esc(user.name.split(" ")[0])}</span><p>Zapytaj o procedurę, cennik albo klienta. Pod odpowiedzią będzie nazwa dokumentu, z którego pochodzi. ${user.dept === "zarzad" ? "Masz dostęp do dokumentów wszystkich działów." : `Masz dostęp do dokumentów działu „${esc(meta.depts[user.dept])}” oraz do dokumentów wspólnych.`}${user.flags.web ? " Masz też włączone wyszukiwanie w internecie." : user.flags.general ? " Masz też włączoną wiedzę ogólną." : ""}</p></div>`;
  $("#chips").classList.remove("used");
  $("#chips").innerHTML = (EXAMPLES[user.dept] || []).map(e => `<button class="chip" type="button">${ICON.bulb}${esc(e)}</button>`).join("");
  $$("#chips button").forEach(b => b.onclick = () => { $("#inp").value = b.textContent; send(); });
  showTab("chat"); refreshActions(); renderMasked(null); loadKb(); loadCases();
}
$("#logout").onclick = async () => { await api("/logout", { method: "POST" }).catch(() => {}); location.replace("/app"); };

/* ---------- zakładki (desktop: górne, telefon: dolny pasek) ---------- */
function showTab(t) {
  $$(".tab,.bn-item").forEach(b => b.classList.toggle("on", b.dataset.t === t));
  $$(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.t === t));
  $$(".bn-item").forEach(b => b.toggleAttribute("aria-current", b.dataset.t === t));
  $$(".pane").forEach(p => p.classList.toggle("on", p.id === "t-" + t));
  $("#body").classList.toggle("not-chat", t !== "chat");
  if (t === "logs") loadLogs(); if (t === "cases") loadCases();
}
$$(".tab,.bn-item").forEach(b => b.onclick = () => showTab(b.dataset.t));

/* ---------- czat ---------- */
function addMsg(role, text, sources, action, opts = {}) {
  const modeHtml = opts.mode === "general" ? `<div class="mode-tag">Odpowiedź ogólna, nie z procedur firmy</div>` : opts.mode === "web" ? `<div class="mode-tag web">Z internetu, nie z procedur firmy</div>` : "";
  const webHtml = opts.web?.length ? `<div class="sources"><span class="sources-label">Źródła w internecie</span>${opts.web.map(w => `<a class="src web" href="${esc(w.url)}" target="_blank" rel="noopener noreferrer">${esc(w.title || w.url)}</a>`).join("")}</div>` : "";
  const d = document.createElement("div"); d.className = "msg " + (role === "me" ? "msg-user" : "msg-ai");
  const srcHtml = sources?.length ? `<div class="sources"><span class="sources-label">Źródła</span>${sources.map((x, i) => `<span class="src" data-n="${Number(x.n) || i + 1}" title="${esc(x.snippet)}">${ICON.docx}${esc(x.file)}</span>`).join("")}</div>` : "";
  const reqHtml = action ? `<a class="req-link" href="#akcje" data-req="${esc(action.id)}"><span class="req-id">${esc(shortId(action.id))}</span><span class="req-name">${esc(TITLES[action.tool] || action.tool)}</span><span class="req-state is-pending">Czeka na Ciebie</span></a>` : "";
  d.innerHTML = role === "me"
    ? `<div class="msg-col"><div class="msg-meta"><span>${hhmm()}</span></div><div class="bubble"></div></div>`
    : `<span class="bot-av">${ICON.mark}</span><div class="msg-col"><div class="msg-meta"><b>Compax</b><span>${hhmm()}</span></div>${modeHtml}<div class="bubble"></div>${srcHtml}${webHtml}${reqHtml}</div>`;
  d.querySelector(".bubble").textContent = text;
  const empty = $("#chat .empty"); if (empty) empty.remove();
  $("#chat").appendChild(d); $("#chat").scrollTop = 1e9;
  if (role !== "me" && isPhone() && opts.scroll !== false) d.scrollIntoView({ block: d.offsetHeight > innerHeight * 0.5 ? "start" : "nearest", behavior: "smooth" });
}
function setReqState(id, state, label) { $$(`[data-req="${id}"] .req-state`).forEach(s => { s.className = "req-state " + state; s.textContent = label; }); }
async function send() {
  const t = $("#inp").value.trim(); if (!t) return;
  $("#inp").value = ""; $("#inp").style.height = ""; $("#chips").classList.add("used"); addMsg("me", t); $("#send").disabled = true;
  const typing = document.createElement("div"); typing.className = "msg msg-ai typing"; typing.setAttribute("aria-label", "Asystent pisze");
  typing.innerHTML = `<span class="bot-av">${ICON.mark}</span><div class="msg-col"><div class="dots"><i></i><i></i><i></i></div></div>`;
  $("#chat").appendChild(typing); $("#chat").scrollTop = 1e9;
  try {
    const r = await api("/chat", { method: "POST", body: JSON.stringify({ message: t, history, provider: $("#prov").value }) }).finally(() => typing.remove());
    if (r.error) throw new Error(r.error);
    addMsg("ai", r.answer, r.sources, r.action, { mode: r.mode, web: r.web });
    if (r.policy?.route !== "blocked") history.push({ role: "user", content: t }, { role: "assistant", content: r.answer }); // zatrzymane pytanie nie wraca w kontekście
    renderMasked(r);
    if (r.action) await refreshActions();
  } catch (e) { addMsg("ai", e.message && !/fetch|network/i.test(e.message) ? e.message : "Nie udało się połączyć z asystentem. Spróbuj jeszcze raz za chwilę."); }
  $("#send").disabled = false;
}
$("#composer").onsubmit = e => { e.preventDefault(); send(); };
$("#inp").onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
$("#inp").oninput = e => { e.target.style.height = ""; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; };

/* ---------- panel: akcje do zatwierdzenia ---------- */
async function refreshActions() {
  pendingList = await api("/actions");
  const n = pendingList.length;
  $("#pendingCount").textContent = n; $("#pendingCount").className = "counter" + (n ? " counter-decide" : "");
  $("#bnDot").textContent = n; $("#bnDot").classList.toggle("off", !n);
  $("#decideBar").classList.toggle("off", !n);
  if (n) $("#decideText").textContent = Object.values(pendingList[0].args)[0] || TITLES[pendingList[0].tool] || "";
  $("#bnDot").setAttribute("aria-label", n + " do zatwierdzenia");
  if (!n) {
    $("#actions").innerHTML = `<div class="empty empty-tight"><span class="empty-title">Nic do zatwierdzenia</span><p>Gdy asystent przygotuje spotkanie, notatkę albo przypomnienie, pojawi się tutaj.</p></div>`;
    return;
  }
  $("#actions").innerHTML = pendingList.map(a => `<article class="action" data-id="${esc(a.id)}">
    <div class="req-head"><span class="req-id">Wniosek ${esc(shortId(a.id))}</span><span class="req-status">Czeka na Ciebie</span></div>
    <h3 class="action-title">${esc(TITLES[a.tool] || a.tool)}</h3>
    <p class="req-meta">Zaproponował Compax · ${hhmm(a.at)}</p>
    <table class="args"><tbody>${Object.entries(a.args).filter(([, v]) => v != null && v !== "").map(([k, v]) => `<tr><th scope="row">${esc(ARG_NAMES[k] || k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table>
    <div class="action-btns"><button class="btn btn-decide" data-a="${esc(a.id)}">Zatwierdź</button><button class="btn btn-secondary" data-r="${esc(a.id)}">Odrzuć</button></div>
  </article>`).join("");
  $$("[data-a]").forEach(b => b.onclick = async () => {
    const r = await api(`/actions/${b.dataset.a}/approve`, { method: "POST" });
    setReqState(b.dataset.a, "is-ok", "Zatwierdzono");
    addMsg("ai", r.result || r.error || "", null, null, { scroll: false });
    await refreshActions(); loadCases();
    $("#actions").insertAdjacentHTML("afterbegin", `<div class="result result-ok" role="status" tabindex="-1">${ICON.check}<span>${esc(r.result)}</span></div>`);
    ($("#actions .action [data-a]") || $("#actions .result"))?.focus();
  });
  $$("[data-r]").forEach(b => b.onclick = async () => {
    await api(`/actions/${b.dataset.r}/reject`, { method: "POST" });
    setReqState(b.dataset.r, "", "Odrzucono");
    addMsg("ai", "Odrzucono. Nic nie zostało wysłane ani zapisane.");
    await refreshActions();
  });
}

/* ---------- panel: co dostał model ---------- */
function renderMasked(r) {
  if (!r) {
    $("#maskedCount").textContent = "0";
    $("#masked").innerHTML = `<div class="empty empty-tight"><span class="empty-title">Jeszcze nic nie wysłano</span><p>Po pierwszym pytaniu zobaczysz tu dokładnie to, co poszło do modelu.</p></div>`;
    return;
  }
  const p = r.policy || {}, u = r.usage;
  const ROUTE = { blocked: ["", "nigdzie, zatrzymane w firmie"], local: ["dot-in", "model w firmie"], external: ["dot-out", "chmura"], mock: ["dot-in", "tryb pokazowy, bez modelu"], cache: ["dot-in", "odpowiedź z pamięci, bez modelu"] };
  const LEVEL = { public: "jawne", internal: "wewnętrzne", restricted: "chronione" };
  const [dotCls, routeLabel] = ROUTE[p.route] || ["", p.route || ""];
  const provLabel = p.route === "mock" || p.route === "local" ? "" : ((meta.providers.find(x => x.id === p.provider) || {}).label || "").replace(/\s*\((chmura|Ollama)\)$/, "");
  const usageTxt = user?.dept === "zarzad" && u && p.route !== "mock" && p.route !== "cache" ? `<b>Tokeny:</b><span>wejściowe ~${u.tokens_in}, wyjściowe ~${u.tokens_out}${p.route === "external" ? ", koszt " + (u.cost == null ? "nieznany (brak cennika)" : u.cost.toFixed(4) + " USD") : ""}</span>` : "";
  const routeHtml = `<div class="mask-sum"><b>Poziom pytania:</b><span class="mask-type">${esc(LEVEL[p.level] || p.level || "")}</span>${(p.reasons || []).map(x => `<span class="mask-type">${esc(x)}</span>`).join("")}</div>
    <div class="mask-sum"><b>Dokąd:</b><span><i class="dot ${dotCls}"></i>${esc(routeLabel)}${provLabel ? " (" + esc(provLabel) + ")" : ""}</span>${p.note ? `<span>· ${esc(p.note)}</span>` : ""}</div>${p.mode ? `<div class="mask-sum"><b>Tryb:</b><span>${p.mode === "web" ? `internet (wyszukiwań: ${p.web_searches || 0})` : "wiedza ogólna dozwolona"}</span></div>` : ""}${p.model && p.route !== "cache" ? `<div class="mask-sum"><b>Model:</b><span>${esc(p.model)}${p.tier ? " · " + TIER[p.tier] : ""}</span></div>` : ""}${usageTxt ? `<div class="mask-sum">${usageTxt}</div>` : ""}`;
  if (p.route === "blocked") {
    $("#maskedCount").textContent = "0";
    $("#masked").innerHTML = `<div class="result" role="status">${ICON.info}<span>Pytanie nie wyszło z firmy. Do modelu nie trafił ani jeden znak.</span></div>${routeHtml}`;
    return;
  }
  const types = tokTypes(r.masked_preview);
  $("#maskedCount").textContent = r.pii_found;
  $("#masked").innerHTML = `<p class="panel-sub">Ostatnie pytanie w takiej postaci, w jakiej trafiło do modelu.</p>
    <p class="masked">${tokens(r.masked_preview)}</p>
    <div class="mask-sum">${r.pii_found ? `<b>Zamaskowane (${r.pii_found}):</b>${types.map(t => `<span class="mask-type">${esc(t)}</span>`).join("")}` : `<span>Bez danych osobowych.</span>`}</div>${routeHtml}`;
}

/* ---------- zakładki: sprawy, dokumenty, logi ---------- */
async function loadKb() {
  const r = await api("/knowledge");
  const up = Object.fromEntries((r.uploaded || []).map(u => [u.path, u]));
  const who = id => (meta.users.find(u => u.id === id) || { name: id }).name;
  $("#kb").innerHTML = r.files.map(f => { const [dept, name] = f.split("/"); const u = up[f];
    return `<li class="li"><div class="li-main"><span class="file-ico">${ICON.docx}</span><div class="grow"><div class="li-title">${esc(name.replace(/\.md$/, "").replace(/-/g, " "))}</div><div class="li-sub">${esc(meta.depts[dept] || dept)}${u ? ` · dodane przez: ${esc(who(u.by))}, ${esc(plDate(u.at, false))}` : ""}</div></div></div>${u && u.canDelete ? `<button class="btn btn-secondary" data-del="${esc(f)}">Usuń</button>` : ""}</li>`; }).join("")
    || `<div class="empty">${ICON.emptyKb}<span class="empty-title">Brak dokumentów</span><p>Dodaj procedurę albo cennik przyciskiem „Dodaj dokument”.</p></div>`;
  const targets = r.canUploadTo || [];
  $("#upDept").hidden = targets.length < 2;
  $("#upDept").innerHTML = targets.map(d => `<option value="${esc(d)}"${d === user.dept ? " selected" : ""}>${esc(meta.depts[d] || d)}</option>`).join("");
  $$("[data-del]").forEach(b => b.onclick = async () => {
    const [dept, file] = b.dataset.del.split("/");
    if (!confirm(`Usunąć „${file}” z bazy działu?`)) return;
    const res = await api(`/documents/${encodeURIComponent(dept)}/${encodeURIComponent(file)}`, { method: "DELETE" });
    $("#upMsg").textContent = res.error || "Usunięto dokument z bazy działu."; loadKb();
  });
}
$("#upFile").onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 200 * 1024) { $("#upMsg").textContent = "Plik jest większy niż 200 KB."; e.target.value = ""; return; }
  const content = await file.text();
  const r = await api("/documents", { method: "POST", body: JSON.stringify({ name: file.name, content, dept: $("#upDept").value || user.dept }) });
  $("#upMsg").textContent = r.error || `Dodano „${r.path}”. ${($("#upDept").value || user.dept) === "wspolne" ? "Asystent od teraz korzysta z niego we wszystkich działach." : `Asystent od teraz korzysta z niego w dziale „${meta.depts[($("#upDept").value || user.dept)]}”.`}`;
  e.target.value = ""; loadKb();
};
let casesAll = [];
// rodzaj sprawy rozpoznany po treści zapisanej przez narzędzie (spotkanie / przypomnienie o płatności / notatka)
const caseType = c => /^Spotkanie/i.test(c.notatka || "") ? "spotkanie" : /płatno/i.test(c.notatka || "") ? "platnosc" : "notatka";
async function loadCases() {
  casesAll = await api("/cases"); if (!Array.isArray(casesAll)) casesAll = [];
  $("#casesTag").textContent = casesAll.length || "";
  const depts = [...new Set(casesAll.map(c => c.dept))];
  $("#cfDept").hidden = depts.length < 2;
  const cur = $("#cfDept").value;
  $("#cfDept").innerHTML = `<option value="">Wszystkie działy</option>` + depts.map(d => `<option value="${esc(d)}">${esc(meta.depts[d] || d)}</option>`).join("");
  $("#cfDept").value = depts.includes(cur) ? cur : "";
  renderCases();
}
function renderCases() {
  const q = $("#cfQ").value.trim().toLowerCase(), type = $("#cfType").value, dept = $("#cfDept").value, sort = $("#cfSort").value;
  let r = casesAll.filter(c => (!q || [c.klient, c.notatka, c.nastepny_krok].join(" ").toLowerCase().includes(q)) && (!type || caseType(c) === type) && (!dept || c.dept === dept));
  r = [...r].sort(sort === "old" ? (a, b) => a.when.localeCompare(b.when) : sort === "az" ? (a, b) => String(a.klient).localeCompare(String(b.klient), "pl") : (a, b) => b.when.localeCompare(a.when));
  const filtered = q || type || dept;
  $("#cfCount").textContent = casesAll.length ? (filtered ? `${r.length} z ${casesAll.length}` : `${casesAll.length} ${plural(casesAll.length, "sprawa", "sprawy", "spraw")}`) : "";
  $("#cases").innerHTML = r.map(c => `<li class="li"><div class="li-main"><span class="li-id">${esc(plDate(c.when))}</span><div class="grow"><div class="li-title">${esc(c.klient)}</div><div class="li-sub">${esc(c.notatka)}</div></div></div><span class="badge badge-wait">${esc(c.nastepny_krok || "")}</span><span class="li-sub">${esc(meta.depts[c.dept] || c.dept)}</span></li>`).join("")
    || (casesAll.length
      ? `<div class="empty"><span class="empty-title">Brak spraw dla tych filtrów</span><p>Zmień wyszukiwanie albo wybierz „Wszystkie”.</p></div>`
      : `<div class="empty">${ICON.emptyCases}<span class="empty-title">Jeszcze nic tu nie ma</span><p>Zatwierdzone spotkania, notatki i przypomnienia pojawią się tutaj.</p></div>`);
}
["#cfQ", "#cfType", "#cfDept", "#cfSort"].forEach(s => $(s).addEventListener("input", renderCases));
async function loadPerm() {
  const [r, depts] = await Promise.all([api("/admin/flags"), api("/admin/depts")]); if (!Array.isArray(r)) return;
  if (Array.isArray(depts)) {
    $("#deptRows").innerHTML = depts.map(d => `<tr><td data-label="Dział">${esc(d.name)}</td><td data-label="Osób">${d.people}</td><td data-label="Chmura"><label class="sw"><input type="checkbox" data-d="${esc(d.dept)}"${d.cloud ? " checked" : ""}><span>${d.cloud ? "Claude po maskowaniu" : "tylko model w firmie"}</span></label></td></tr>`).join("");
    $$("#deptRows input").forEach(cb => cb.onchange = async () => {
      const res = await api(`/admin/depts/${cb.dataset.d}`, { method: "POST", body: JSON.stringify({ cloud: cb.checked }) });
      if (res.error) { cb.checked = !cb.checked; return; }
      loadPerm();
    });
  }
  const opts = cur => Object.entries(meta.depts).filter(([k]) => k !== "wspolne").map(([k, v]) => `<option value="${esc(k)}"${k === cur ? " selected" : ""}>${esc(v)}</option>`).join("");
  $("#permRows").innerHTML = r.map(u => `<tr><td data-label="Pracownik">${esc(u.name)}<br><small class="perm-role">${esc(u.role || "")}</small></td><td data-label="Dział"><select class="perm-dept" data-u="${esc(u.id)}" aria-label="Dział: ${esc(u.name)}"${u.self ? ` disabled title="Własnego działu nie można zmienić"` : ""}>${opts(u.dept)}</select></td>${["general", "web"].map(k => `<td data-label="${k === "web" ? "Internet" : "Wiedza ogólna"}"><label class="sw"><input type="checkbox" data-u="${esc(u.id)}" data-k="${k}"${u[k] ? " checked" : ""}${u.cloud ? "" : " disabled"}><span>${u.cloud ? (u[k] ? "włączone" : "wyłączone") : "dział bez chmury"}</span></label></td>`).join("")}</tr>`).join("");
  $$("#permRows input").forEach(cb => cb.onchange = async () => {
    const res = await api(`/admin/flags/${cb.dataset.u}`, { method: "POST", body: JSON.stringify({ [cb.dataset.k]: cb.checked }) });
    if (res.error) { cb.checked = !cb.checked; return; }
    cb.nextElementSibling.textContent = cb.checked ? "włączone" : "wyłączone";
  });
  $$("#permRows select").forEach(sel => sel.onchange = async () => {
    const res = await api(`/admin/users/${sel.dataset.u}`, { method: "POST", body: JSON.stringify({ dept: sel.value }) });
    if (res.error) alert(res.error);
    loadPerm();
  });
}
async function loadLogs() {
  loadPerm();
  const [r, usage, fb] = await Promise.all([api("/logs"), api("/usage"), api("/feedback")]); if (r.error) return;
  const FB = { problem: "Problem", pomysl: "Pomysł", pytanie: "Pytanie" };
  $("#fb").hidden = !Array.isArray(fb) || !fb.length;
  if (Array.isArray(fb)) $("#fbList").innerHTML = fb.slice(0, 20).map(f => `<li class="li"><div class="li-main"><span class="li-id">${esc(plDate(f.ts))}</span><div class="grow"><div class="li-title"><span class="badge${f.type === "problem" ? " badge-stop" : ""}">${esc(FB[f.type] || f.type)}</span> ${esc(f.userName || who(f.userId))}, ${esc(f.deptName || "")}</div><div class="li-sub">${esc(f.text)}</div></div></div><span class="li-sub">${esc(f.id)}${f.via === "email" ? " · wysłane e-mailem" : ""}${f.screenshot ? ` · <a href="/api/feedback/${esc(f.id)}/screenshot" target="_blank" rel="noopener">zrzut ekranu</a>` : ""}</span></li>`).join("");
  const who = id => (meta.users.find(u => u.id === id) || { name: id }).name;
  const prov = id => (meta.providers.find(p => p.id === id) || {}).label || id || "";
  const money = (u) => u.cloud ? (u.costKnown ? usd(u.cost) : "koszt nieznany, brak cennika") : "0 USD";
  const budgetHtml = usage.budgetUsd ? `<div><b>Budżet na chmurę</b><small>${usd(usage.spentUsd).replace(" USD", "")} z ${usage.budgetUsd} USD w tym miesiącu</small><small>po jego wyczerpaniu odpowiada model w firmie albo tryb pokazowy</small></div>` : "";
  $("#usage").innerHTML = budgetHtml + ((usage.depts || []).length
    ? usage.depts.map(u => `<div><b>${esc(meta.depts[u.dept] || u.dept)}</b><small>${u.queries} ${plural(u.queries, "pytanie", "pytania", "pytań")} w tym miesiącu</small><small>chmura: ${u.cloud} z ${usage.cloudMonthlyLimit} · w firmie: ${u.local}${u.cached ? " · z pamięci: " + u.cached : ""}${u.blocked ? " · nie wysłano: " + u.blocked : ""}</small><small>~${u.tokens} ${plural(u.tokens, "token", "tokeny", "tokenów")} · ${money(u)}</small></div>`).join("")
    : `<div><b>Ten miesiąc</b><small>Jeszcze nikt nie pytał.</small></div>`);
  $("#logs").innerHTML = r.map(l => {
    const ev = l.event === "action_approved" ? `<span class="badge badge-ok">Zatwierdzono</span>` : l.event === "action_rejected" ? `<span class="badge">Odrzucono</span>` : l.event === "blocked" ? `<span class="badge badge-stop">Nie wysłano</span>` : l.event === "provider_error" ? `<span class="badge">Błąd modelu</span>` : l.event === "login_failed" ? `<span class="badge">Nieudane logowanie</span>` : l.event === "flags_changed" ? "Zmiana uprawnień" : l.event === "role_changed" ? "Zmiana działu" : l.event === "policy_changed" ? "Zmiana modeli działu" : l.event === "feedback" ? "Zgłoszenie" : l.event === "doc_added" ? "Dodano dokument" : l.event === "doc_removed" ? "Usunięto dokument" : l.event === "action_rejected_by_gateway" ? `<span class="badge">Odrzucone przez system</span>` : "Pytanie";
    const routeTxt = l.policy ? `<br><i class="dot ${l.policy.route === "external" ? "dot-out" : l.policy.route === "blocked" ? "" : "dot-in"}"></i>${esc(l.policy.route === "external" ? "chmura" : l.policy.route === "blocked" ? "nie wyszło" : l.policy.route === "cache" ? "z pamięci" : l.policy.route === "mock" ? "bez modelu" : "w firmie")}${l.policy.reasons?.length ? " (" + esc(l.policy.reasons.join(", ")) + ")" : ""}` : "";
    const det = l.event === "blocked" ? `${esc(l.policy?.note || "")}${routeTxt}` : l.event ? esc(l.action || "") + (l.result ? " · " + esc(l.result) : "") : tokens(l.prompt_masked || "") + (l.pii_found ? `<br>zamaskowano: ${tokTypes(l.prompt_masked).join(", ")}` : "") + (l.action ? `<br>wniosek: ${esc(l.action)}` : "") + routeTxt;
    const tok = l.tokens_in != null ? `${l.tokens_in}→${l.tokens_out}${l.policy?.route === "external" ? "<br>" + (l.cost == null ? "koszt nieznany" : l.cost.toFixed(4) + " USD") : ""}` : "";
    return `<tr><td class="mono" data-label="Czas">${esc(new Date(l.ts).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }))}</td><td data-label="Kto">${esc(who(l.userId))}</td><td data-label="Zdarzenie">${ev}</td><td class="mono" data-label="Model">${esc(l.event && l.event !== "blocked" ? "" : (l.policy?.model || prov(l.provider)))}${l.policy?.tier && l.policy.route !== "blocked" ? "<br>" + esc(TIER[l.policy.tier] || "") : ""}</td><td class="mono" data-label="Tokeny">${tok}</td><td class="mono" data-label="Szczegóły">${det}</td><td class="mono" data-label="Dokumenty">${(l.sources || []).map(esc).join("<br>")}</td></tr>`;
  }).join("") || `<tr><td colspan="7"><div class="empty">${ICON.emptyLogs}<span class="empty-title">Brak wpisów</span><p>Pytania i decyzje pracowników pojawią się tutaj.</p></div></td></tr>`;
}
init();

/* ---------- tryb jasny / ciemny: zapamiętany na tym urządzeniu, domyślnie jak w systemie ---------- */
(() => {
  const KEY = "compax-theme", root = document.documentElement;
  let saved = null; try { saved = localStorage.getItem(KEY); } catch {}
  if (saved) root.dataset.theme = saved;
  const current = () => root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const btns = [...document.querySelectorAll(".theme-btn")];
  const label = () => btns.forEach(b => b.setAttribute("aria-label", current() === "dark" ? "Włącz tryb jasny" : "Włącz tryb ciemny"));
  label();
  btns.forEach(b => b.onclick = () => { const next = current() === "dark" ? "light" : "dark"; root.dataset.theme = next; try { localStorage.setItem(KEY, next); } catch {} label(); });
})();


/* ---------- wybór modelu: własne menu zamiast natywnej listy; wartość trzyma ukryty <select id="prov"> ---------- */
const MODEL_INFO = {
  mock:      { name: "Tryb pokazowy", sub: "bez modelu AI, pokazuje fragmenty dokumentów", where: "in" },
  ollama:    { name: "Model w firmie", sub: "dane nie opuszczają serwera", where: "in" },
  anthropic: { name: "Claude", sub: "chmura, dane osobowe maskowane przed wysłaniem", where: "out" },
  openai:    { name: "GPT", sub: "chmura, dane osobowe maskowane przed wysłaniem", where: "out" }
};
function renderModelPicker(allowed) {
  // do wyboru: modele podłączone i dozwolone w dziale (tryb pokazowy nie jest wyborem, tylko zapasem serwera)
  const localReady = allowed.some(p => p.id === "ollama"), cloudOk = allowed.some(p => MODEL_INFO[p.id]?.where === "out");
  const items = allowed.filter(p => p.id !== "mock").map(p => ({ id: p.id, ...(MODEL_INFO[p.id] || { name: p.label, sub: "", where: "out" }) }));
  // na szaro: modele, które brama obsłuży po dodaniu klucza albo serwera (bez zmian w kodzie)
  const soon = [
    ...(localReady ? [] : [
      { id: "ollama-soon", name: "Bielik", sub: "polski model na serwerze firmy, do danych chronionych", where: "in" },
      { id: "ollama-any-soon", name: "Ollama", sub: "dowolny model lokalny (Llama, Qwen, Mistral) na serwerze firmy", where: "in" }
    ]),
    ...(cloudOk ? [
      { id: "openai-soon", name: "GPT", sub: "OpenAI, chmura", where: "out" },
      { id: "gemini-soon", name: "Gemini", sub: "Google, chmura", where: "out" },
      { id: "mistral-soon", name: "Mistral", sub: "chmura w UE", where: "out" }
    ].filter(c => !allowed.some(p => p.id === c.id.replace("-soon", ""))) : [])
  ].map(c => ({ ...c, disabled: true }));
  const fallback = { id: "mock", name: "Bez modelu AI", sub: "", where: "in" };
  // domyślnie: dostawca ustawiony na serwerze, jeśli dział go ma; inaczej pierwszy podłączony; bez modeli: odpowiedzi z dokumentów
  const def = items.find(p => p.id === meta.provider) || items[0] || fallback;
  $("#prov").innerHTML = allowed.map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join("");
  $("#prov").value = def ? def.id : "";
  const list = $("#mpList"), btn = $("#mpBtn");
  const choose = id => {
    $("#prov").value = id; const it = items.find(i => i.id === id) || fallback;
    $("#mpLabel").textContent = it.name; $("#mpDot").className = "mp-dot " + (it.where === "in" ? "in" : "out");
    list.querySelectorAll("[role=option]").forEach(o => o.setAttribute("aria-selected", o.dataset.id === id));
  };
  const note = items.length ? "" : `<p class="mp-note">Ten dział korzysta tylko z modelu w firmie. Do czasu jego podłączenia asystent odpowiada fragmentami dokumentów działu.</p>`;
  list.innerHTML = `<div class="mp-head">Model dla działu ${esc(meta.depts[user.dept] || "")}</div>` + note + [...items, ...soon].map(it => `
    <div class="mp-opt${it.disabled ? " is-off" : ""}" role="option" data-id="${esc(it.id)}" tabindex="${it.disabled ? -1 : 0}" aria-disabled="${!!it.disabled}">
      <i class="mp-dot ${it.where}"></i>
      <span class="mp-text"><b>${esc(it.name)}</b><small>${esc(it.sub)}</small></span>
      ${it.disabled ? '<span class="mp-tag">do podłączenia</span>' : '<svg class="mp-check" width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M15.85 5.65a.5.5 0 0 1 0 .7l-7.5 7.5a.5.5 0 0 1-.7 0l-3.5-3.5a.5.5 0 1 1 .7-.7L8 12.79l7.15-7.14a.5.5 0 0 1 .7 0" fill="currentColor"></path></svg>'}
    </div>`).join("") + `<div class="mp-foot"><i class="mp-dot in"></i>w firmie <i class="mp-dot out"></i>chmura</div>`;
  const open = v => { list.hidden = !v; btn.setAttribute("aria-expanded", v); if (v) (list.querySelector('[aria-selected="true"]') || list.querySelector(".mp-opt:not(.is-off)"))?.focus(); };
  btn.onclick = () => open(list.hidden);
  list.querySelectorAll(".mp-opt:not(.is-off)").forEach(o => {
    o.onclick = () => { choose(o.dataset.id); open(false); btn.focus(); };
    o.onkeydown = e => {
      const opts = [...list.querySelectorAll(".mp-opt:not(.is-off)")], i = opts.indexOf(o);
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); o.click(); }
      if (e.key === "ArrowDown") { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
    };
  });
  document.addEventListener("click", e => { if (!$("#modelPick").contains(e.target)) open(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !list.hidden) { open(false); btn.focus(); } });
  choose($("#prov").value);
}

/* ---------- „Zgłoś”: problem, pomysł albo pytanie prosto do opiekuna systemu ---------- */
(() => {
  const dlg = $("#report"), form = $("#reportForm"), msg = $("#reportMsg"), send = $("#reportSend");
  let shot = null; // zrzut jako data URL (po przerysowaniu: bez metadanych, max 1600 px)
  const setShot = url => { shot = url; $("#reportPreview").hidden = !url; $("#reportImg").src = url || ""; };
  // przerysowanie przez canvas: usuwa metadane (np. lokalizację ze zdjęcia), zmniejsza i ujednolica format
  const normalize = src => new Promise((ok, bad) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      let out = c.toDataURL("image/png"); if (out.length > 3.2e6) out = c.toDataURL("image/jpeg", .85);
      ok(out);
    };
    img.onerror = () => bad(new Error("Nie udało się odczytać obrazu."));
    img.src = src;
  });
  const fromFile = async file => {
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) { msg.textContent = "Dodaj obraz PNG, JPG albo WebP."; msg.className = "rp-msg is-err"; return; }
    if (file.size > 15e6) { msg.textContent = "Obraz jest za duży (najwyżej 15 MB przed zmniejszeniem)."; msg.className = "rp-msg is-err"; return; }
    // odczyt jako data URL (CSP dopuszcza obrazy data:, nie blob:)
    const url = await new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => bad(new Error("Nie udało się odczytać pliku.")); r.readAsDataURL(file); }).catch(e => { msg.textContent = e.message; msg.className = "rp-msg is-err"; return null; });
    if (!url) return;
    try { setShot(await normalize(url)); msg.textContent = ""; } catch (e) { msg.textContent = e.message; msg.className = "rp-msg is-err"; }
  };
  $("#reportFile").onchange = e => { fromFile(e.target.files[0]); e.target.value = ""; };
  $("#reportRemove").onclick = () => setShot(null);
  dlg.addEventListener("paste", e => { const it = [...(e.clipboardData?.items || [])].find(x => x.type.startsWith("image/")); if (it) { e.preventDefault(); fromFile(it.getAsFile()); } });
  // zrzut bieżącej karty: przeglądarka pyta o zgodę; okno zgłoszenia chowa się na czas zrzutu
  if (navigator.mediaDevices?.getDisplayMedia && matchMedia("(pointer:fine)").matches) {
    $("#reportShot").hidden = false;
    $("#reportShot").onclick = async () => {
      dlg.close();
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "browser" }, audio: false, preferCurrentTab: true });
        const v = document.createElement("video"); v.muted = true; v.srcObject = stream; await v.play();
        await new Promise(r => setTimeout(r, 250)); // klatka bez okna zgłoszenia
        const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0);
        stream.getTracks().forEach(t => t.stop());
        setShot(await normalize(c.toDataURL("image/png")));
      } catch { /* anulowano albo brak zgody: bez zrzutu */ }
      dlg.showModal();
    };
  }
  const close = () => dlg.close();
  $("#reportBtn").onclick = () => { msg.textContent = ""; msg.className = "rp-msg"; setShot(null); dlg.showModal(); $("#reportText").focus(); };
  $("#reportClose").onclick = close; $("#reportCancel").onclick = close;
  dlg.addEventListener("click", e => { if (e.target === dlg) close(); }); // kliknięcie w tło zamyka
  form.onsubmit = async e => {
    e.preventDefault();
    const text = $("#reportText").value.trim();
    if (text.length < 10) { msg.textContent = "Opisz sprawę w co najmniej 10 znakach."; msg.className = "rp-msg is-err"; return; }
    const context = $("#reportCtx").checked ? { tab: $(".tab.on")?.textContent.trim(), screen: `${innerWidth}×${innerHeight}`, browser: navigator.userAgent, theme: document.documentElement.dataset.theme || "system" } : {};
    send.disabled = true; send.textContent = "Wysyłanie…";
    const r = await api("/feedback", { method: "POST", body: JSON.stringify({ type: form.rtype.value, text, context, screenshot: shot }) }).catch(() => ({ error: "Brak połączenia z serwerem. Spróbuj ponownie." }));
    send.disabled = false; send.textContent = "Wyślij zgłoszenie";
    if (r.error) { msg.textContent = r.error; msg.className = "rp-msg is-err"; return; }
    msg.textContent = r.via ? `Dziękujemy! Zgłoszenie ${r.id} trafiło do opiekuna systemu.` : `Dziękujemy! Zgłoszenie ${r.id} zostało zapisane, opiekun systemu je zobaczy.`; msg.className = "rp-msg is-ok";
    $("#reportText").value = ""; setShot(null);
    setTimeout(close, 1800);
  };
})();
