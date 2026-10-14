// Ekran startowy: jedno wejście (zaczernienie danych w karcie demo), ujawnianie sekcji przy przewijaniu
// i światło za kursorem. Bez bibliotek, bez zewnętrznych skryptów, z poszanowaniem „ogranicz ruch”.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.getElementById("hero"), demo = document.getElementById("demo"), masked = demo.querySelector(".masked");
  if (reduce) { document.documentElement.classList.add("no-motion"); masked.classList.add("on"); demo.classList.add("on"); return; }

  // 1. Wejście: dane osobowe znikają pod etykietami chwilę po załadowaniu
  setTimeout(() => { masked.classList.add("on"); demo.classList.add("on"); }, 700);

  // 2. Przewijanie: zapas dla przeglądarek bez animation-timeline, plus kroki dostają klasę .in (kolor numeru)
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
  document.querySelectorAll(".reveal, .step").forEach(el => io.observe(el));

  // 3. Kursor: lekkie pochylenie karty demo w sekcji otwierającej. Tylko dla urządzeń z myszą.
  if (!matchMedia("(hover: hover)").matches) return;
  let raf = 0, px = 0, py = 0;
  window.addEventListener("pointermove", e => {
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
