# Platforma AI dla firmy wielodziałowej – demo

Demo do koncepcji „jedna wspólna platforma AI, osobni agenci dla działów”. Pokazuje fundament w praktyce:

- **logowanie z rolą** – użytkownik widzi tylko dokumenty swojego działu i dokumenty wspólne (zarząd widzi wszystko),
- **baza wiedzy** – pliki `.md` w `knowledge/<dział>/`, odpowiedzi z podaniem źródła,
- **brama AI** – jeden punkt dostępu do modeli; dostawca wybierany konfiguracją (mock / Claude / OpenAI / Ollama),
- **maskowanie danych osobowych** przed wysłaniem do modelu (panel „Co dostał model”),
- **akcje z zatwierdzeniem** – agent przygotowuje spotkanie, notatkę, przypomnienie; wykonuje po kliknięciu „Zatwierdź”,
- **pamięć spraw** zamiast CRM – lekki rejestr klientów i następnych kroków,
- **logi** – co poszło do modelu, ile danych zamaskowano, jakie źródła, jaka akcja (zakładka dla zarządu).

Firma w demo jest fikcyjna (Nordica Serwis Sp. z o.o.), dane przykładowe.

## Uruchomienie (bez klucza API, 1 minuta)

```bash
npm install
npm start
# http://localhost:3000
```

Zaloguj się jako jeden z pracowników i użyj podpowiedzi pod czatem.

## Konta demo

| Użytkownik | Dział |
|---|---|
| anna (Anna Lis) | sprzedaż |
| marek (Marek Wójcik) | obsługa klienta |
| ewa (Ewa Nowak) | biuro / administracja |
| tomasz (Tomasz Kaczmarek) | księgowość |
| prezes (Jan Zieliński) | zarząd, widzi wszystko i logi |

Hasła kont demo są przekazywane osobno, nie w repozytorium. W kodzie są tylko hashe (scrypt z solą, `server/security.js`), więc wyciek repozytorium nie ujawnia haseł. Własne hasło: `node -e "import('./server/security.js').then(m => console.log(m.hashPassword('TwojeHaslo')))"` i wklej wynik do `server/users.js`. W produkcji logowanie przejmuje SSO (Microsoft Entra / Google Workspace).

## Warianty dostawcy AI

Skopiuj `.env.example` do `.env` i ustaw `AI_PROVIDER`:

| Wariant | `.env` | Kiedy |
|---|---|---|
| `mock` (domyślny) | brak klucza | pokaz architektury bez kosztów; odpowiedzi = najtrafniejsze fragmenty bazy wiedzy |
| `anthropic` | `ANTHROPIC_API_KEY`, `MODEL=claude-sonnet-4-5` | pełne odpowiedzi, narzędzia wybierane przez model |
| `openai` | `OPENAI_API_KEY`, `MODEL=gpt-4o-mini` | to samo, inny dostawca – zmiana w jednym miejscu |
| `ollama` | `OLLAMA_URL=http://localhost:11434`, `MODEL=llama3.1` | model lokalny, dane nie opuszczają serwera |

Zmiana dostawcy nie wymaga zmian w kodzie agentów – to jest sens bramy AI.

## Co pokazać na prezentacji (5 minut)

1. Zaloguj się jako **Anna (sprzedaż)**: „Jaki rabat mogę dać sam?” → odpowiedź ze źródłem.
2. Zapytaj o coś z księgowości: „Kiedy wysyłamy wezwanie do zapłaty?” → asystent nie widzi tych dokumentów (uprawnienia).
3. „Umów spotkanie z Pan Jan Kowalski tel. 600 123 456 we wtorek 10:00” → w panelu po prawej widać, że do modelu poszło `[OSOBA_1]`, `[TELEFON_1]`; akcja czeka na zatwierdzenie.
4. Zatwierdź → zakładka **Sprawy** pokazuje wpis (pamięć bez CRM).
5. Zaloguj się jako **Prezes** → zakładka **Logi**: co, kto, ile PII, jakie źródła, ile ms.

## Struktura

```
server/index.js      – API, przepływ: uprawnienia → retrieval → maskowanie → model → odmaskowanie → log
server/providers.js  – brama AI (mock / anthropic / openai / ollama)
server/knowledge.js  – baza wiedzy: cięcie na fragmenty + wyszukiwanie (BM25-podobne, bez zależności)
server/pii.js        – maskowanie / odmaskowanie danych osobowych
server/tools.js      – narzędzia agenta i ich wykonanie po zatwierdzeniu
server/store.js      – pamięć spraw, kolejka akcji, logi (JSON w data/)
server/users.js      – użytkownicy demo i działy
server/security.js   – nagłówki HTTP, sesje z wygasaniem, limit prób logowania
server/policy.js     – klasyfikacja wrażliwości, trasowanie (lokalny / zewnętrzny / blokada), alert
knowledge/<dział>/   – dokumenty firmy (.md)
public/index.html    – interfejs (bez frameworka, żeby demo działało offline)
skills/              – przykładowy skill dla Claude Code: checklista bezpieczeństwa wdrożenia AI
```

## Brama AI: dostawcy, polityka działów, klasyfikacja, koszty

Układ hybrydowy: model lokalny na serwerze firmy jako domyślny, chmura tylko tam, gdzie dział ma na to zgodę, i tylko po zamaskowaniu. Wszystko w `server/policy.js`.

| Element | Jak działa | Konfiguracja |
|---|---|---|
| Dostawcy | mock (demo), ollama (lokalny), anthropic, openai; dostępne są te, do których są klucze lub adresy | `AI_PROVIDER`, `OLLAMA_URL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| Polityka działu | administrator ustala, jakich dostawców dział może używać; pracownik wybiera w nagłówku tylko spośród nich. Domyślnie księgowość i zarząd: tylko serwer firmy | `DEPT_POLICY_JSON` |
| Klasyfikacja | jawne / wewnętrzne (dane osobowe, zamaskowane) / chronione (PESEL, numer konta, zdrowie, wynagrodzenia, dane uwierzytelniające) | reguły w `policy.js` (produkcja: Presidio/NER) |
| Trasa | chronione: wyłącznie model lokalny, bez niego wiadomość zostaje w bramie; pozostałe: wybrany dozwolony dostawca | automatycznie |
| Limit chmury | miesięczny limit zapytań do chmury na dział; po wyczerpaniu model lokalny albo zatrzymanie | `CLOUD_MONTHLY_LIMIT` |
| Koszty | szacunek tokenów i koszt z cennika w logu każdego zapytania; zarząd widzi sumy per dział w bieżącym miesiącu | `PRICING_JSON` |
| Alert | zatrzymana wiadomość = wpis `blocked` bez treści i powiadomienie administratora | `ALERT_WEBHOOK_URL` |

Panel „Co dostał model” pokazuje poziom, dokąd poszło zapytanie (zielona kropka: serwer firmy, bursztynowa: chmura) i szacowany koszt.

## Co jest uproszczone (i jak wygląda w produkcji)

| W demo | W produkcji |
|---|---|
| hasła z hashem scrypt, lista użytkowników w kodzie | SSO Microsoft Entra / Google Workspace, role z katalogu firmy |
| wyszukiwanie leksykalne | embeddingi + PostgreSQL/pgvector lub Qdrant, uprawnienia per dokument |
| maskowanie i klasyfikacja regułami | Microsoft Presidio + NER dla polskiego, polityka per dział w konfiguracji |
| akcje zapisują do pliku | API kalendarza/poczty/faktur lub MCP, z zatwierdzeniem |
| logi w JSON | baza z retencją, alerty błędów (Telegram/Teams), panel kosztów per dział |
| jeden proces Node | serwer w UE, HTTPS, sekrety w sejfie, kopie zapasowe |

## Wdrożenie na VPS

Gotowe skrypty i instrukcja krok po kroku dla Hetzner Cloud (Caddy + HTTPS, pm2, firewall, użytkownik bez uprawnień): [deploy/README.md](deploy/README.md).

Autor: Piotr Bednarski, październik 2026.
