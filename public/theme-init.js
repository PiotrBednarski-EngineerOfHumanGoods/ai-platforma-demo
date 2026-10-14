// Ustawia zapamiętany tryb jasny/ciemny przed pierwszym malowaniem strony (bez mignięcia).
try { const t = localStorage.getItem("compax-theme"); if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; } catch {}
