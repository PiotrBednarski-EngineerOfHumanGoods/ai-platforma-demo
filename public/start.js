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
  let done = false;
  const end = () => { root.classList.remove("with-intro"); el.remove(); dispatchEvent(new Event("compax:intro-done")); };
  const finish = mode => {
    if (done) return; done = true;
    try { sessionStorage.setItem("compax-intro", "1"); } catch {}
    el.classList.add(mode);
    const hero = document.querySelector("#compass svg");
    if (mode !== "go" || !hero || !Element.prototype.animate) return setTimeout(end, 380);
    // moneta leci w kompas strony: środek do środka, skala tak, żeby jej znak miał rozmiar kompasu
    const wrap = coin.parentElement, w = wrap.getBoundingClientRect(), t = hero.getBoundingClientRect();
    const dx = t.left + t.width / 2 - (w.left + w.width / 2), dy = t.top + t.height / 2 - (w.top + w.height / 2);
    const s = t.width / (w.width * 0.58), D = 1600, opts = { duration: D, easing: "cubic-bezier(.45,.05,.2,1)", fill: "forwards" };
    needle.animate([{ transform: getComputedStyle(needle).transform }, { transform: "rotate(0deg)" }], { duration: 1100, easing: "cubic-bezier(.3,0,.2,1)", fill: "forwards" }); // igła ląduje tak jak w kompasie strony
    wrap.animate([{ transform: "translate(0,0) scale(1)" }, { transform: "translate(0,-3%) scale(1.04)", offset: .18 }, { transform: `translate(${dx}px,${dy}px) scale(${s})` }], opts);
    el.querySelector(".coin").animate([{ transform: "rotateY(0deg)", easing: "cubic-bezier(.5,0,.3,1)" }, { transform: "rotateX(10deg) rotateY(180deg)", offset: .36, easing: "cubic-bezier(.3,0,.25,1)" }, { transform: "rotateY(360deg)", offset: .7 }, { transform: "rotateY(360deg)" }], { duration: D, fill: "forwards" });
    const fade = { duration: D, easing: "linear", fill: "forwards" };
    el.querySelectorAll(".edge i").forEach(n => n.animate([{ opacity: 1 }, { opacity: 1, offset: .6 }, { opacity: 0, offset: .7 }, { opacity: 0 }], fade)); // krawędź gaśnie, gdy zasłania ją awers
    el.querySelector(".rim").animate([{ opacity: 1 }, { opacity: 1, offset: .74 }, { opacity: 0 }], fade); // potem znika tarcza, zostaje sam znak
    setTimeout(end, D + 40);
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
      if (performance.now() - t0 > 6000) el.classList.add("real"); // pokazowy kursor znika, gdy użytkownik sam działa
      const r = coin.getBoundingClientRect();
      aim(Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI + 45);
    });
  }
})();

// Ekran startowy: jedno wejście (zaczernienie danych w karcie demo), ujawnianie sekcji przy przewijaniu
// i światło za kursorem. Bez bibliotek, bez zewnętrznych skryptów, z poszanowaniem „ogranicz ruch”.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.getElementById("hero"), demo = document.getElementById("demo"), masked = demo.querySelector(".masked");
  if (reduce) { document.documentElement.classList.add("no-motion"); masked.classList.add("on"); demo.classList.add("on"); return; }

  // 1. Wejście: dane osobowe znikają pod etykietami chwilę po załadowaniu
  const enter = () => setTimeout(() => { masked.classList.add("on"); demo.classList.add("on"); }, 700);
  if (document.documentElement.classList.contains("with-intro")) addEventListener("compax:intro-done", enter, { once: true }); else enter();

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
