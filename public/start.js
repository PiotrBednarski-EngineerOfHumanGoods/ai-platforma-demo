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

  // 3. Kursor: światło w tle i lekkie pochylenie karty demo. Tylko dla urządzeń z myszą.
  if (!matchMedia("(hover: hover)").matches) return;
  let raf = 0, px = 0, py = 0;
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width; py = (e.clientY - r.top) / r.height;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      hero.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      hero.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      demo.style.setProperty("--rx", ((px - 0.5) * 6).toFixed(2) + "deg");
      demo.style.setProperty("--ry", ((0.5 - py) * 6).toFixed(2) + "deg");
    });
  });
  hero.addEventListener("pointerleave", () => { demo.style.setProperty("--rx", "0deg"); demo.style.setProperty("--ry", "0deg"); });
})();
