// Warstwa bezpieczeństwa HTTP: nagłówki, sesje z wygasaniem, limit prób logowania.
// Celowo bez zależności (helmet, express-rate-limit), żeby było widać, co dokładnie się dzieje.
// W produkcji: SSO (Microsoft Entra / Google) zamiast PIN-u i sesje w Redis zamiast w pamięci procesu.
import crypto from "crypto";

// Nagłówki bezpieczeństwa. HSTS dokłada reverse proxy (Caddy), bo to on terminuje HTTPS.
export function securityHeaders(req, res, next) {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"
  });
  next();
}

// Sesje: losowy token (nie do zgadnięcia) ważny przez określony czas.
export function createSessions({ ttlMs = 8 * 60 * 60 * 1000 } = {}) {
  const sessions = new Map();
  return {
    create(user) {
      const token = crypto.randomBytes(24).toString("hex");
      sessions.set(token, { user, exp: Date.now() + ttlMs });
      return token;
    },
    // middleware Express: ustawia req.user albo odpowiada 401
    auth(req, res, next) {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const s = sessions.get(token);
      if (!s || s.exp < Date.now()) { sessions.delete(token); return res.status(401).json({ error: "Zaloguj się" }); }
      req.user = s.user; next();
    }
  };
}

// Limit nieudanych logowań per IP. 4-cyfrowy PIN ma 10 000 kombinacji, bez limitu zgadnięcie zajęłoby minutę.
export function createLoginLimiter({ max = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const fails = new Map();
  return {
    blocked(ip) { const e = fails.get(ip); return !!e && e.n >= max && Date.now() - e.t < windowMs; },
    failed(ip) { const e = fails.get(ip); if (!e || Date.now() - e.t > windowMs) fails.set(ip, { n: 1, t: Date.now() }); else e.n++; },
    reset(ip) { fails.delete(ip); }
  };
}
