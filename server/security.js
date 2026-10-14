// Warstwa bezpieczeństwa HTTP: nagłówki, sesje z wygasaniem, limit prób logowania.
// Celowo bez zależności (helmet, express-rate-limit), żeby było widać, co dokładnie się dzieje.
// W produkcji: SSO (Microsoft Entra / Google) zamiast własnych haseł i sesje w Redis zamiast w pamięci procesu.
import crypto from "crypto";

// Nagłówki bezpieczeństwa. HSTS dokłada reverse proxy (Caddy), bo to on terminuje HTTPS.
export function securityHeaders(req, res, next) {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    ...(req.path.startsWith("/api") ? { "Cache-Control": "no-store" } : {}),
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'"
  });
  next();
}

// Anty-CSRF: żądania zmieniające dane muszą nieść nagłówek, którego zwykły formularz z obcej strony nie wyśle.
// Razem z ciasteczkiem SameSite=Strict daje dwie niezależne warstwy.
export function requireCsrfHeader(req, res, next) {
  if (req.path.startsWith("/api") && req.method !== "GET" && req.get("x-requested-with") !== "compax") {
    return res.status(400).json({ error: "Nieprawidłowe żądanie. Odśwież stronę." });
  }
  next();
}

// Sesje: losowy token (nie do zgadnięcia) ważny przez określony czas, przenoszony w ciasteczku
// HttpOnly + SameSite=Strict (skrypt na stronie nie ma do niego dostępu, obca strona go nie wyśle).
// Nagłówek Authorization: Bearer jest akceptowany dla narzędzi API i testów.
export const SESSION_COOKIE = "compax.sid";
export function createSessions({ ttlMs = 8 * 60 * 60 * 1000 } = {}) {
  const sessions = new Map();
  const tokenFrom = req => {
    const bearer = req.headers.authorization?.replace("Bearer ", "");
    if (bearer) return bearer;
    const m = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([a-f0-9]+)`));
    return m ? m[1] : null;
  };
  return {
    create(user) {
      const token = crypto.randomBytes(24).toString("hex");
      sessions.set(token, { user, exp: Date.now() + ttlMs });
      return token;
    },
    setCookie(res, token, secure) {
      res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: "strict", secure, maxAge: ttlMs, path: "/" });
    },
    clearCookie(res) { res.clearCookie(SESSION_COOKIE, { path: "/" }); },
    tokenFrom,
    // sesja ważna albo null (bez odpowiedzi 401), np. do treści zależnych od zalogowania
    get(token) { const s = token && sessions.get(token); return s && s.exp >= Date.now() ? s : null; },
    // middleware Express: ustawia req.user albo odpowiada 401
    auth(req, res, next) {
      const token = tokenFrom(req);
      const s = sessions.get(token);
      if (!s || s.exp < Date.now()) { sessions.delete(token); return res.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." }); }
      req.user = s.user; next();
    },
    destroy(token) { sessions.delete(token); }
  };
}

// Limit nieudanych logowań per IP: chroni przed zgadywaniem haseł.
export function createLoginLimiter({ max = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const fails = new Map();
  return {
    blocked(ip) { const e = fails.get(ip); return !!e && e.n >= max && Date.now() - e.t < windowMs; },
    failed(ip) { const e = fails.get(ip); if (!e || Date.now() - e.t > windowMs) fails.set(ip, { n: 1, t: Date.now() }); else e.n++; },
    reset(ip) { fails.delete(ip); }
  };
}

// Hasła: scrypt z losową solą, zapis "scrypt$sól$hash". W kodzie nigdy nie ma hasła, tylko hash.
// Nowy hash: node -e "import('./server/security.js').then(m => console.log(m.hashPassword('TwojeHaslo')))"
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
export function verifyPassword(password, stored) {
  const [algo, salt, hash] = String(stored || "").split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const given = crypto.scryptSync(String(password ?? ""), salt, 32);
  const expected = Buffer.from(hash, "hex");
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

// Ogólny limit żądań per IP (okno przesuwane w pamięci procesu). Chroni klucz API i serwer przed zalaniem.
export function rateLimit({ max, windowMs }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const list = (hits.get(req.ip) || []).filter(t => now - t < windowMs);
    if (list.length >= max) return res.status(429).json({ error: "Za dużo pytań w krótkim czasie. Spróbuj ponownie za minutę." });
    list.push(now); hits.set(req.ip, list); next();
  };
}
