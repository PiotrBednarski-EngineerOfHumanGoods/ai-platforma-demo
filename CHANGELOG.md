# Zmiany

## 1.2.0 – 2026-10-14

Uprawnienia zmieniane przez zarząd w panelu, bez wdrożenia.

- Przeniesienie pracownika do innego działu: od następnego pytania widzi dokumenty, narzędzia i modele nowego działu, bez ponownego logowania. Zarząd nie może zmienić własnego działu.
- Chmura (Claude po maskowaniu) włączana i wyłączana dla całego działu; ma pierwszeństwo przed `DEPT_POLICY_JSON`. Dane chronione nie wychodzą niezależnie od ustawienia.
- Każda zmiana w dzienniku zarządu; 2 nowe testy (razem 50), w tym odrzucenie nazw typu `__proto__`.

## 1.1.0 – 2026-10-14

Przegląd bezpieczeństwa, RODO i języka przed oddaniem klientowi.

- Bezpieczeństwo: dziennik nie zapisuje już danych osobowych przy zatwierdzaniu wniosku; lista pracowników dostępna dopiero po zalogowaniu; aplikacja uruchomiona ze złym kluczem nie nadpisuje zaszyfrowanych danych.
- RODO: rejestr czynności przetwarzania, kwalifikacja DPIA, procedura naruszenia (docs/06); narzędzie administratora do wyszukania, eksportu i usunięcia danych osoby oraz do zmiany klucza szyfrowania (`npm run admin`).
- Model zagrożeń z testem do każdego zabezpieczenia (docs/07), polityka zgłaszania podatności (SECURITY.md).
- Jakość: test dymny wszystkich funkcji na działającym serwerze (`npm run smoke`), CI na każdą zmianę z `npm audit`, Dependabot.
- Interfejs: czyste adresy /app i /prywatnosc, komunikaty błędów widoczne dla pracownika, polska odmiana i daty, spójne nazwy (maskowanie, wniosek, dziennik), strona prywatności zgodna z CSP.

## 1.0.0 – 2026-10-14

Pierwsza wersja gotowa do pokazania klientowi.

- Asystent dla wielu działów: logowanie z rolą, osobna baza wiedzy dla każdego działu z podaniem źródła, wnioski zatwierdzane przez człowieka, rejestr spraw, dziennik i koszty dla zarządu.
- Brama AI: maskowanie danych osobowych (także odmienionych imion, IBAN z PL, PESEL ze spacją), klasyfikacja jawne / wewnętrzne / chronione obejmująca historię rozmowy, polityka dostawców dla każdego działu, dobór modelu do pytania, pamięć odpowiedzi, budżet miesięczny i limity, walidacja akcji proponowanych przez model.
- Dostawcy: tryb pokazowy, Claude (Anthropic), GPT (OpenAI), model w firmie przez Ollamę.
- Dokumenty dodawane przez pracowników w aplikacji, szyfrowanie danych na dysku (AES-256-GCM), codzienne kopie zapasowe.
- Bezpieczeństwo: scrypt, sesja w ciasteczku HttpOnly/SameSite=Strict, ochrona CSRF, blokada kont, CSP bez wyjątków, Cache-Control no-store dla API.
- Interfejs: strona startowa z przebiegiem pytania sterowanym przewijaniem i kompasem podążającym za kursorem, aplikacja w trybie jasnym i ciemnym, wersja na telefon.
- Wdrożenie: Hetzner (Caddy, HTTPS, pm2, firewall), aktualizacja przez `git archive`.
- 31 testów automatycznych (`npm test`), dokumentacja dla klienta w `docs/`.
