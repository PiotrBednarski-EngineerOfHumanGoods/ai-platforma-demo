/* ---------- igła kompasu: płynnie za kursorem (rAF, najkrótszy łuk), po bezruchu wraca na północ ---------- */
function smoothNeedle(el, { idleMs = 2000 } = {}) {
  let cur = 0, target = 0, raf = 0, idle = 0, last = 0;
  const step = t => {
    const dt = Math.min(64, t - (last || t)); last = t;
    const diff = ((target - cur + 540) % 360) - 180;          // najkrótsza droga, bez obrotu „dookoła”
    cur += diff * (1 - Math.exp(-dt / (target === 0 && idle < 0 ? 260 : 90)));
    el.style.setProperty("--ang", cur.toFixed(2) + "deg");
    raf = Math.abs(diff) > 0.05 ? requestAnimationFrame(step) : (last = 0, 0);
  };
  return deg => {
    target = deg; idle = 1;
    if (!raf) raf = requestAnimationFrame(step);
    clearTimeout(el._idleT);
    el._idleT = setTimeout(() => { target = 0; idle = -1; if (!raf) raf = requestAnimationFrame(step); }, idleMs);
  };
}

/* ---------- intro (tylko gdy theme-init.js ustawił html.with-intro) ---------- */
(() => {
  const root = document.documentElement, el = document.getElementById("intro");
  if (!el || !root.classList.contains("with-intro")) return;
  const coin = document.getElementById("introCoin"), cta = el.querySelector(".intro-cta"), needle = el.querySelector(".front .needle");
  // środek monety (okno odsłaniające) i środek przycisku (cel kursora), liczone bez animacji wejścia
  const measure = () => {
    const r = coin.parentElement.getBoundingClientRect();
    el.style.setProperty("--cx", r.left + r.width / 2 + "px");
    el.style.setProperty("--cy", r.top + r.height / 2 + "px");
    const b = cta.getBoundingClientRect();
    el.style.setProperty("--bx", b.left + b.width / 2 + "px");
    el.style.setProperty("--by", b.top + b.height / 2 - 12 + "px"); // przycisk wjeżdża 12px od dołu
  };
  measure(); addEventListener("resize", measure); document.fonts?.ready.then(measure);
  const go = () => requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("ready")));
  Promise.race([document.fonts?.ready || Promise.resolve(), new Promise(r => setTimeout(r, 900))]).then(go);
  let done = false;
  const wave = () => {
    const c = document.querySelector("#compass svg")?.getBoundingClientRect(); if (!c) return;
    const x = c.left + c.width / 2, y = c.top + c.height / 2, R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 1.1;
    // tafla: soczewka + grzbiet fali, potem drugi, słabszy krąg
    ["w1"].forEach(k => {
      const w = document.createElement("div"); w.className = "water " + k;
      w.style.setProperty("--wx", x + "px"); w.style.setProperty("--wy", y + "px"); w.style.setProperty("--wd", 2 * R + "px");
      w.style.setProperty("--s0", ((c.width / 2) / (R * .58)).toFixed(4)); // wewnętrzna krawędź kręgu startuje na krawędzi kompasu
      document.body.appendChild(w); w.addEventListener("animationend", () => w.remove());
    });
    // elementy strony uginają się, gdy grzbiet fali przez nie przechodzi (tylko transformacje: płynnie)
    const T = 3400, ease = r => 1 - Math.pow(1 - r, 1.5); // ten sam profil co animacja kręgu
    const at = d => { let lo = 0, hi = 1; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (ease(m) * R * .9 < d) lo = m; else hi = m; } return lo * T; };
    document.querySelectorAll(".top .brand, .topnav > *, .hero h1, .hero .lead, .hero .cta, .hero .note, .demo, .hero ~ section h2").forEach(el => {
      const r = el.getBoundingClientRect(); if (r.top > innerHeight) return;
      const ex = r.left + r.width / 2 - x, ey = r.top + r.height / 2 - y, d = Math.hypot(ex, ey) || 1, k = 5 * Math.max(.35, 1 - d / R);
      el.animate([{ translate: "0 0", scale: 1 }, { translate: `${(ex / d) * k}px ${(ey / d) * k}px`, scale: 1.012, offset: .35 }, { translate: `${(-ex / d) * k * .35}px ${(-ey / d) * k * .35}px`, scale: .997, offset: .7 }, { translate: "0 0", scale: 1 }],
        { duration: 1700, delay: at(d), easing: "cubic-bezier(.37,0,.25,1)" });
    });
  };
  const end = withWave => { root.classList.remove("with-intro"); el.remove(); if (withWave) wave(); dispatchEvent(new Event("compax:intro-done")); };
  const angleOf = n => { const m = new DOMMatrix(getComputedStyle(n).transform); return Math.atan2(m.b, m.a) * 180 / Math.PI; };
  const finish = mode => {
    if (done) return; done = true;
    try { localStorage.setItem("compax-intro", new Date().toISOString()); } catch {}
    el.classList.add(mode);
    const hero = document.querySelector("#compass svg"), heroWrap = document.getElementById("compass");
    if (mode !== "go" || !hero || !Element.prototype.animate) return setTimeout(() => end(false), 380);
    // jeden ciągły ruch: moneta obraca się (trzy obroty, zwalnia na końcu) i jednocześnie leci prosto w kompas strony
    const wrap = coin.parentElement, coinEl = el.querySelector(".coin");
    const w = wrap.getBoundingClientRect(), t = hero.getBoundingClientRect(); // opakowanie jest płaskie: pomiar zawsze poprawny
    const dx = t.left + t.width / 2 - (w.left + w.width / 2), dy = t.top + t.height / 2 - (w.top + w.height / 2), s = t.width / (w.width * 0.58);
    const D = 2600, from = angleOf(needle), to = parseFloat(getComputedStyle(heroWrap).getPropertyValue("--ang")) || 0;
    needle.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }], { duration: D, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    coinEl.animate([{ transform: "rotateY(0deg)" }, { transform: "rotateX(9deg) rotateY(900deg)", offset: .45 }, { transform: "rotateY(1800deg)" }], { duration: D, easing: "cubic-bezier(.37,0,.2,1)", fill: "forwards" }); // pięć obrotów, miękki start i hamowanie
    wrap.animate([{ transform: "translate(0,0) scale(1)" }, { transform: "translate(0,-2%) scale(1.03)", offset: .12 }, { transform: `translate(${dx * .55}px,${dy * .45 - 18}px) scale(${(1 + s) / 2})`, offset: .62 }, { transform: `translate(${dx}px,${dy}px) scale(${s})` }], { duration: D, easing: "cubic-bezier(.45,0,.25,1)", fill: "forwards" });
    const fade = (n, at) => n.animate([{ opacity: 1 }, { opacity: 1, offset: at }, { opacity: 0 }], { duration: D, fill: "forwards" });
    el.querySelectorAll(".edge i").forEach(n => n.animate([{ opacity: 1 }, { opacity: 1, offset: .66 }, { opacity: 0, offset: .82 }, { opacity: 0 }], { duration: D, fill: "forwards" })); // krawędź gaśnie najpierw // srebrna krawędź gaśnie, gdy moneta zwalnia awersem do przodu
    fade(el.querySelector(".rim"), .86);                      // potem biała tarcza                       // biała tarcza na samym końcu: zostaje znak w rozmiarze kompasu
    setTimeout(() => end(true), D);                            // ląduje w miejscu kompasu strony (wektor)
  };
  coin.onclick = () => finish("go");
  cta.onclick = () => finish("go");
  el.querySelector(".intro-skip").onclick = () => finish("skip");
  addEventListener("keydown", e => {
    if (done) return;
    if (e.key === "Escape") finish("skip");
    else if ((e.key === "Enter" || e.key === " ") && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); finish("go"); }
  });
  if (matchMedia("(hover: hover)").matches) {
    const aim = smoothNeedle(needle), t0 = performance.now();
    el.addEventListener("pointermove", e => {
      if (performance.now() - t0 > 6800) el.classList.add("real"); // pokazowy kursor znika, gdy użytkownik sam działa
      const r = coin.getBoundingClientRect();
      aim(Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI + 45);
    });
  }
})();

// Ekran startowy: jedno wejście (zaczernienie danych w karcie demo), ujawnianie sekcji przy przewijaniu
// i światło za kursorem. Bez bibliotek, bez zewnętrznych skryptów, z poszanowaniem „ogranicz ruch”.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // kompas na pełnych pikselach ekranu: bez półpikselowego rozmycia krawędzi przy skalowaniu 100% i 125%
  const heroCompass = document.getElementById("compass");
  const snap = () => {
    if (!heroCompass) return;
    heroCompass.style.translate = ""; const r = heroCompass.getBoundingClientRect(), d = devicePixelRatio || 1;
    heroCompass.style.translate = `${(Math.round(r.left * d) - r.left * d) / d}px ${(Math.round(r.top * d) - r.top * d) / d}px`;
  };
  snap(); addEventListener("resize", snap); document.fonts?.ready.then(snap);
  const hero = document.getElementById("hero"), demo = document.getElementById("demo"), masked = demo.querySelector(".masked");
  if (reduce) { document.documentElement.classList.add("no-motion"); masked.classList.add("on"); demo.classList.add("on"); return; }

  // 1. Wejście: dane osobowe znikają pod etykietami chwilę po załadowaniu
  const enter = () => setTimeout(() => { masked.classList.add("on"); demo.classList.add("on"); }, 700);
  if (document.documentElement.classList.contains("with-intro")) addEventListener("compax:intro-done", () => setTimeout(enter, 1400), { once: true }); else enter();

  // 2. Przewijanie: zapas dla przeglądarek bez animation-timeline, plus kroki dostają klasę .in (kolor numeru)
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
  document.querySelectorAll(".reveal, .step").forEach(el => io.observe(el));

  // 3. Kursor: igła kompasu wskazuje kursor (jak prawdziwa igła biegun), po chwili bezruchu wraca na północ;
  //    plus lekkie pochylenie karty demo w sekcji otwierającej. Tylko dla urządzeń z myszą.
  if (!matchMedia("(hover: hover)").matches) return;
  const compass = document.getElementById("compass"), aim = smoothNeedle(compass);
  // igła w znaku wskazuje domyślnie północny wschód (45°), więc kąt do kursora liczymy względem tego kierunku
  const point = (x, y) => {
    const r = compass.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const deg = Math.atan2(y - cy, x - cx) * 180 / Math.PI; // 0° = w prawo
    aim(deg + 45);
  };
  let raf = 0, px = 0, py = 0;
  window.addEventListener("pointermove", e => {
    point(e.clientX, e.clientY);
    const r = hero.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width; py = (e.clientY - r.top) / r.height;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      const inHero = px >= 0 && px <= 1 && py >= 0 && py <= 1;
      demo.style.setProperty("--rx", inHero ? ((px - 0.5) * 6).toFixed(2) + "deg" : "0deg");
      demo.style.setProperty("--ry", inHero ? ((0.5 - py) * 6).toFixed(2) + "deg" : "0deg");
    });
  }, { passive: true });
  document.addEventListener("pointerleave", () => { demo.style.setProperty("--rx", "0deg"); demo.style.setProperty("--ry", "0deg"); });
})();

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

/* ---------- jedno pytanie krok po kroku: etap z postępu przewijania ---------- */
(() => {
  const track = document.querySelector(".story-track"), card = document.getElementById("storyCard"), bar = document.getElementById("storyBar");
  if (!track || !card) return;
  const items = [...document.querySelectorAll(".story-steps li")];
  const set = (s, p) => {
    card.className = "story-card s" + s + (p > 0.92 ? " done" : "");
    items.forEach((li, i) => li.classList.toggle("on", i <= s));
    if (bar) bar.style.width = Math.round(p * 100) + "%";
  };
  const static_ = () => matchMedia("(max-width:900px), (prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  const update = () => {
    raf = 0;
    if (static_()) return set(4, 1);
    const r = track.getBoundingClientRect(), total = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    set(Math.min(4, Math.floor(p * 5)), p);
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener("resize", update);
  update();
})();
