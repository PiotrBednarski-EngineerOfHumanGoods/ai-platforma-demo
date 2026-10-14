// Przed pierwszym malowaniem strony: zapamiętany tryb jasny/ciemny (bez mignięcia)
// i decyzja, czy pokazać intro na stronie startowej (raz na sesję, nie przy „ogranicz ruch”; ?intro wymusza).
try { const t = localStorage.getItem("compax-theme"); if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; } catch {}
try {
  const force = /[?&]intro\b/.test(location.search);
  if (location.pathname === "/" && !matchMedia("(prefers-reduced-motion: reduce)").matches && (force || !sessionStorage.getItem("compax-intro")))
    document.documentElement.classList.add("with-intro");
} catch {}
