# Zmiany

## 1.0.0 – 2026-10-14

Pierwsza wersja gotowa do pokazania klientowi.

- Asystent dla wielu działów: logowanie z rolą, baza wiedzy per dział z podaniem źródła, wnioski zatwierdzane przez człowieka, rejestr spraw, dziennik i koszty dla zarządu.
- Brama AI: zamazywanie danych osobowych (także odmienionych imion, IBAN z PL, PESEL ze spacją), klasyfikacja jawne / wewnętrzne / chronione obejmująca historię rozmowy, polityka dostawców per dział, dobór modelu do pytania, pamięć odpowiedzi, budżet miesięczny i limity, walidacja akcji proponowanych przez model.
- Dostawcy: tryb pokazowy, Claude (Anthropic), GPT, model w firmie przez Ollamę.
- Dokumenty dodawane przez pracowników w aplikacji, szyfrowanie danych na dysku (AES-256-GCM), codzienne kopie zapasowe.
- Bezpieczeństwo: scrypt, sesja w ciasteczku HttpOnly/SameSite=Strict, ochrona CSRF, blokada kont, CSP bez wyjątków, Cache-Control no-store dla API.
- Interfejs: strona startowa z przebiegiem pytania sterowanym przewijaniem i kompasem za kursorem, aplikacja w trybie jasnym i ciemnym, wersja na telefon.
- Wdrożenie: Hetzner (Caddy, HTTPS, pm2, firewall), aktualizacja przez `git archive`.
- 31 testów automatycznych (`npm test`), dokumentacja dla klienta w `docs/`.
