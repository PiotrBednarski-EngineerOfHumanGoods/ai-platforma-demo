# Compax – asystent AI dla firmy z kilkoma działami

**Demo na żywo:** https://195-201-97-88.sslip.io (ekran startowy) · logowanie: https://195-201-97-88.sslip.io/app.html, konta demo pod formularzem.

Odpowiedź na pytanie: *firma ma kilka działów i chce dostępu do AI, ale działy różnią się danymi i uprawnieniami – jak to zrobić?* Jedna wspólna platforma, a na niej osobna konfiguracja dla każdego działu: własne dokumenty, narzędzia i polityka modeli. Wszyscy logują się do tego samego asystenta, ale dostęp do danych zależy od działu.

- **logowanie z rolą** – użytkownik widzi tylko dokumenty swojego działu i dokumenty wspólne (zarząd widzi wszystko),
- **baza wiedzy** – pliki `.md` w `knowledge/<dział>/`, odpowiedzi z podaniem źródła,
- **brama AI** – jeden punkt dostępu do modeli; dostawca wybierany konfiguracją (mock / Claude / OpenAI / Ollama),
- **maskowanie danych osobowych** przed wysłaniem do modelu (panel „Co dostał model”),
- **akcje z zatwierdzeniem** – agent przygotowuje spotkanie, notatkę, przypomnienie; wykonuje po kliknięciu „Zatwierdź”,
- **pamięć spraw** zamiast CRM – lekki rejestr klientów i następnych kroków,
- **logi** – co poszło do modelu, ile danych zamaskowano, jakie źródła, jaka akcja (zakładka dla zarządu).

- **brama danych** – klasyfikacja jawne / wewnętrzne / chronione; dane chronione tylko do modelu w firmie, reszta do chmury po zamazaniu,
- **koszty pod kontrolą** – tani model do prostych pytań, mocny do analiz, pamięć odpowiedzi, budżet miesięczny i limity na dział,
- **dokumenty od pracowników** – dodawane w aplikacji do bazy działu; dane na dysku szyfrowane, codzienne kopie.

Firma w demo jest fikcyjna (Kriomar sp. z o.o.), dane przykładowe. W wersji na żywo działa prawdziwy model Claude z budżetem 3 USD miesięcznie; księgowość i zarząd celowo nie korzystają z chmury.

## Dokumentacja dla klienta

| Dokument | Dla kogo |
|---|---|
| [Przegląd dla zarządu](docs/01-przeglad-dla-klienta.md) | zarząd: co robi, czego nie robi, jak chroni dane |
| [Bezpieczeństwo i RODO](docs/02-bezpieczenstwo-i-rodo.md) | IT, inspektor ochrony danych: przepływ, klasyfikacja, gdzie są dane, szyfrowanie, dostęp |
| [Instrukcja administratora](docs/03-instrukcja-administratora.md) | administrator: konfiguracja, użytkownicy, dokumenty, kopie i odtworzenie, rotacja kluczy |
| [Koszty](docs/04-koszty.md) | zarząd, finanse: koszt pytania, co go obniża, model w firmie, przykładowy miesiąc |
| [Plan wdrożenia](docs/05-plan-wdrozenia.md) | zarząd i kierownicy działów: etapy, miary, co przygotowuje klient |
| [Koncepcja (PDF)](Platforma_AI_dla_firmy_wielodzialowej.pdf) | pełny opis rozwiązania |

## Uruchomienie (bez klucza API, 1 minuta)

```bash
npm install
npm start    # http://localhost:3000 – ekran startowy, logowanie pod /app.html
npm test     # 31 testów automatycznych (node --test), bez dodatkowych zależności
```

Zaloguj się jako jeden z pracowników i użyj podpowiedzi pod czatem.

## Konta demo

| Login | Osoba | Dział | Co sprawdzić |
|---|---|---|---|
| `a.lis` | Anna Lis | sprzedaż | pytanie o rabat (Claude, ze źródłem), spotkanie z zamazanym nazwiskiem i zatwierdzeniem |
| `m.wojcik` | Marek Wójcik | obsługa klienta | czas reakcji na awarię, reklamacje |
| `e.nowak` | Ewa Nowak | biuro | rezerwacja sali, delegacje |
| `t.kaczmarek` | Tomasz Kaczmarek | księgowość | windykacja; nic nie wychodzi do chmury, PESEL zatrzymany |
| `j.zielinski` | Jan Zieliński | zarząd | zakładka Logi: trasa, model i koszt każdego pytania, budżet miesiąca |

Hasła kont demo są wypisane na ekranie logowania (rozwijana lista „Konta demo”), bo firma i dane są fikcyjne. W kodzie są tylko hashe (scrypt z solą, `server/security.js`), więc wyciek repozytorium nie ujawnia haseł. Własne hasło: `node -e "import('./server/security.js').then(m => console.log(m.hashPassword('TwojeHaslo')))"` i wklej wynik do `server/users.js`. W produkcji logowanie przejmuje SSO (Microsoft Entra / Google Workspace).

## Warianty dostawcy AI

Skopiuj `.env.example` do `.env` i ustaw `AI_PROVIDER`:

| Wariant | `.env` | Kiedy |
|---|---|---|
| `mock` (domyślny) | brak klucza | pokaz architektury bez kosztów; odpowiedzi = najtrafniejsze fragmenty bazy wiedzy |
| `anthropic` | `ANTHROPIC_API_KEY`; modele dobierane automatycznie (`ANTHROPIC_MODEL_CHEAP`, `ANTHROPIC_MODEL_STRONG`), `MODEL` ustawia jeden na sztywno | pełne odpowiedzi, narzędzia wybierane przez model |
| `openai` | `OPENAI_API_KEY`, `MODEL=gpt-4o-mini` | to samo, inny dostawca – zmiana w jednym miejscu |
| `ollama` | `OLLAMA_URL=http://localhost:11434`, `OLLAMA_MODEL=llama3.1` (np. Bielik) | model w firmie, dane nie opuszczają serwera; obsługuje dane chronione |

Zmiana dostawcy nie wymaga zmian w kodzie agentów – to jest sens bramy AI.

## Co pokazać na prezentacji (5 minut)

1. Zaloguj się jako **Anna (sprzedaż)**: „Jaki rabat mogę dać sam?” → odpowiedź ze źródłem; w panelu „Co dostał model” trasa i koszt.
2. Zapytaj o coś z księgowości: „Kiedy wysyłamy wezwanie do zapłaty?” → asystent nie widzi tych dokumentów (uprawnienia).
3. „Umów spotkanie z panem Janem Kowalskim, tel. 600 123 456, we wtorek o 10:00” → do modelu poszło „osoba 1”, „telefon 1”; wniosek czeka na zatwierdzenie.
4. Zatwierdź → zakładka **Sprawy** pokazuje wpis (pamięć bez CRM).
5. Zaloguj się jako **Tomasz (księgowość)**: „Zapisz: PESEL 85010112345 klienta” → pytanie nie wychodzi z firmy.
6. Zaloguj się jako **Jan (zarząd)** → zakładka **Logi**: kto, co poszło do modelu, którą trasą, ile kosztowało, budżet miesiąca.

## Struktura

```
server/app.js        – API i przepływ: uprawnienia → wyszukiwanie → maskowanie → klasyfikacja → pamięć → trasa → model → odmaskowanie → walidacja akcji → log
server/index.js      – uruchomienie serwera
server/providers.js  – brama AI (mock / anthropic / openai / ollama)
server/knowledge.js  – baza wiedzy: cięcie na fragmenty + wyszukiwanie (BM25-podobne, bez zależności)
server/pii.js        – maskowanie / odmaskowanie danych osobowych
server/tools.js      – narzędzia agenta i ich wykonanie po zatwierdzeniu
server/store.js      – sprawy, logi, liczniki chmury, pamięć odpowiedzi (JSON w data/, zapis atomowy); kolejka wniosków w pamięci procesu
server/users.js      – użytkownicy demo i działy
server/security.js   – nagłówki HTTP, sesje z wygasaniem, limit prób logowania
server/policy.js     – klasyfikacja wrażliwości, trasowanie (lokalny / zewnętrzny / blokada), alert
knowledge/<dział>/   – dokumenty firmy (.md)
public/index.html    – ekran startowy (co to jest, jak działa, działy, poziomy danych)
public/app.html      – aplikacja: logowanie, czat, sprawy, dokumenty, logi (app.js, app.css; bez frameworka)
public/prywatnosc.html – informacja o przetwarzaniu danych i zasady korzystania
tests/app.test.mjs   – testy: logowanie, uprawnienia, maskowanie, brama, wnioski, walidacja
skills/              – przykładowy skill dla Claude Code: checklista bezpieczeństwa wdrożenia AI
```

## Brama AI: dostawcy, polityka działów, klasyfikacja, koszty

Kolejność: najpierw to, co darmowe (pamięć odpowiedzi, model w firmie), potem tani model, mocny tylko do trudnych pytań, chmura tylko tam, gdzie dział ma zgodę, i tylko po zamaskowaniu. Wszystko w `server/policy.js`.

| Element | Jak działa | Konfiguracja |
|---|---|---|
| Dostawcy | mock (demo), ollama (lokalny), anthropic, openai; dostępne są te, do których są klucze lub adresy | `AI_PROVIDER`, `OLLAMA_URL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| Polityka działu | administrator ustala, jakich dostawców dział może używać; pracownik wybiera w nagłówku tylko spośród nich. Domyślnie księgowość i zarząd: tylko serwer firmy | `DEPT_POLICY_JSON` |
| Klasyfikacja | jawne / wewnętrzne (dane osobowe, zamaskowane) / chronione (PESEL, numer konta, zdrowie, wynagrodzenia, dane uwierzytelniające) | reguły w `policy.js` (produkcja: Presidio/NER) |
| Trasa | chronione: wyłącznie model lokalny, bez niego wiadomość zostaje w bramie; pozostałe: wybrany dozwolony dostawca | automatycznie |
| Limit chmury | miesięczny limit zapytań do chmury na dział; po wyczerpaniu model lokalny albo zatrzymanie | `CLOUD_MONTHLY_LIMIT` |
| Dobór modelu | proste pytanie i prośba o akcję idą do taniego modelu, analiza (porównaj, podsumuj, raport, długie pytanie) do mocnego; pytanie bez trafień w dokumentach nie idzie do modelu w ogóle; pracownik wybiera dostawcę, poziom dobiera brama | `ANTHROPIC_MODEL_CHEAP`, `ANTHROPIC_MODEL_STRONG` |
| Pamięć odpowiedzi | pytanie bez danych osobowych i bez akcji, na które już odpowiedziano z tych samych dokumentów, wraca z pamięci za 0; klucz zawiera dział i wersję dokumentów, ważność 7 dni | automatycznie |
| Koszty | tokeny z odpowiedzi dostawcy i koszt z cennika w logu każdego zapytania; zarząd widzi sumy per dział i budżet w bieżącym miesiącu | `PRICING_JSON`, `APP_MONTHLY_BUDGET_USD` |
| Alert | zatrzymana wiadomość = wpis `blocked` bez treści i powiadomienie administratora | `ALERT_WEBHOOK_URL` |

Panel „Co dostał model” pokazuje poziom, dokąd poszło zapytanie (zielona kropka: serwer firmy, bursztynowa: chmura) i szacowany koszt.

## Dokumenty i dane

- **Dodawanie dokumentów.** Pracownik dodaje plik .md lub .txt w zakładce „Moja baza wiedzy” do bazy swojego działu, zarząd do dowolnego działu i do wspólnych. Dokument działa w wyszukiwaniu od razu i tylko dla działu, do którego trafił. Usunąć go może autor albo zarząd. Każde dodanie i usunięcie jest w dzienniku. Czat nie zapisuje się jako wiedza: dokument to świadoma czynność.
- **Szyfrowanie na dysku.** Gdy ustawiony jest `DATA_KEY`, wszystkie pliki w `data/` (sprawy, dziennik, liczniki, pamięć odpowiedzi, wgrane dokumenty) są zapisywane jako AES-256-GCM z losowym wektorem i znacznikiem integralności. Zapis atomowy, prawa 600.
- **Kopie zapasowe.** `deploy/backup.sh --install` dodaje codzienną kopię zaszyfrowanych danych, przechowywaną 14 dni. Klucz nie jest częścią kopii.

## Klucze do modeli: dwie opcje

| Opcja | Jak działa | Kiedy |
|---|---|---|
| Klucz API w zmiennej środowiskowej | klucz w `.env` na serwerze, prawa `600`, dostęp tylko dla procesu aplikacji; limit wydatków ustawiony w konsoli Anthropic jako drugi bezpiecznik | to demo: zwykły serwer VPS (Hetzner) nie wystawia tożsamości chmurowej |
| Federacja tożsamości (Workload Identity Federation) | serwer nie przechowuje żadnego klucza; tożsamość nadana przez chmurę (konto usługi GCP, rola AWS, tożsamość Azure, GitHub Actions) wymienia się na token Anthropic ważny kilka minut i odnawiany automatycznie | wdrożenie u klienta w jego chmurze i CI: nie ma statycznego klucza do wycieku ani do ręcznej rotacji |

W obu wariantach klucz lub token nigdy nie trafia do przeglądarki ani do repozytorium.

## Co jest uproszczone (i jak wygląda w produkcji)

| W demo | W produkcji |
|---|---|
| hasła z hashem scrypt, sesja w ciasteczku HttpOnly, blokada konta, lista użytkowników w kodzie | SSO Microsoft Entra / Google Workspace, role z katalogu firmy, sesje w Redis |
| wyszukiwanie leksykalne | embeddingi + PostgreSQL/pgvector lub Qdrant, uprawnienia per dokument |
| maskowanie i klasyfikacja regułami | Microsoft Presidio + NER dla polskiego, polityka per dział w konfiguracji |
| akcje zapisują do pliku | API kalendarza/poczty/faktur lub MCP, z zatwierdzeniem |
| dane w plikach JSON zaszyfrowanych AES-256-GCM, klucz w `.env`, codzienna kopia na tym samym serwerze | PostgreSQL z szyfrowaniem, klucz w KMS, kopie poza serwerem (np. Hetzner Backup, S3 z wersjonowaniem) |
| dokumenty .md/.txt dodawane w aplikacji do bazy działu | import PDF/DOCX, synchronizacja z SharePointem / Dyskiem Google, zatwierdzanie dokumentów przez kierownika |
| logi w JSON | baza z retencją, alerty błędów (Telegram/Teams), panel kosztów per dział |
| jeden proces Node | serwer w UE, HTTPS, sekrety w sejfie, kopie zapasowe |

## Wdrożenie na VPS

Gotowe skrypty i instrukcja krok po kroku dla Hetzner Cloud (Caddy + HTTPS, pm2, firewall, użytkownik bez uprawnień): [deploy/README.md](deploy/README.md).

## Licencja

© 2026 Piotr Bednarski, wszelkie prawa zastrzeżone. Kod opublikowany do oceny w procesie rekrutacyjnym; wykorzystanie poza tym celem wymaga zgody autora. Szczegóły w pliku `LICENSE`.

Autor: Piotr Bednarski, październik 2026.
