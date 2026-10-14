// Przed pierwszym malowaniem strony: zapamiętany tryb jasny/ciemny (bez mignięcia)
// i decyzja, czy pokazać intro na stronie startowej: raz na przeglądarce (zapisane od razu, więc odświeżenie go nie powtarza),
// nie przy „ogranicz ruch”; ?intro wymusza pokaz, a parametr znika z adresu.
try { const t = localStorage.getItem("compax-theme"); if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; } catch {}
try {
  const force = /[?&]intro\b/.test(location.search);
  if (force) history.replaceState(null, "", location.pathname + location.hash);
  let seen = false; try { seen = !!localStorage.getItem("compax-intro"); } catch {}
  if (location.pathname === "/" && !matchMedia("(prefers-reduced-motion: reduce)").matches && (force || !seen)) {
    document.documentElement.classList.add("with-intro");
    try { localStorage.setItem("compax-intro", new Date().toISOString()); } catch {}
  }
} catch {}
