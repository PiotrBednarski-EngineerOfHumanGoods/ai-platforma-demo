# Compax – jedno AI dla firmy z kilkoma działami

[![CI](https://github.com/PiotrBednarski-EngineerOfHumanGoods/ai-platforma-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/PiotrBednarski-EngineerOfHumanGoods/ai-platforma-demo/actions/workflows/ci.yml)

**Demo na żywo:** https://compax.tech · logowanie: https://compax.tech/app (konta pokazowe na ekranie logowania)

> **Pytanie:** firma ma kilka działów i chce dać pracownikom AI, ale działy mają różne dane i uprawnienia, a firma nie ma CRM. Jak to zrobić?

## Jak to rozwiązałem: jedna platforma, dział to konfiguracja

Zamiast osobnego AI dla każdego działu jest **jeden asystent i jedna brama do modeli**, a dział to konfiguracja: własne dokumenty, własne narzędzia i własne zasady, z jakich modeli wolno korzystać. Wszyscy logują się w jednym miejscu, ale każdy widzi tylko to, do czego ma prawo.

| Wspólne dla całej firmy | Osobne dla każdego działu |
|---|---|
| logowanie i role | dokumenty (procedury, cenniki, windykacja) |
| brama do modeli AI (Claude, GPT, model w firmie) | narzędzia (np. sprzedaż umawia spotkania, księgowość wysyła przypomnienia o płatności) |
| maskowanie danych osobowych i blokada danych chronionych | dozwolone modele (księgowość i zarząd: tylko model w firmie, bez chmury) |
| dziennik, koszty i budżet dla zarządu | limit pytań do chmury |

Cztery zasady, które trzymają całość:

1. **Uprawnienia przed wyszukiwaniem.** Asystent szuka tylko w dokumentach działu pracownika i we wspólnych. Model nigdy nie dostaje dokumentu, którego pracownik nie mógłby otworzyć sam.
2. **Dane osobowe nie wychodzą jawnie.** Nazwiska, telefony i e-maile są zamieniane na etykiety („osoba 1”) przed wysłaniem do modelu. PESEL, numer konta, karta, dowód, zdrowie i wynagrodzenia nie wychodzą z firmy wcale.
3. **Człowiek decyduje.** Asystent tylko przygotowuje spotkanie, notatkę albo przypomnienie. Nic się nie dzieje bez „Zatwierdź”.
4. **Zarząd widzi wszystko, co trzeba.** Kto pytał, dokąd trafiło pytanie, jakim modelem, ile kosztowało. Bez treści danych osobowych.

**Nowy dział** to folder z dokumentami i kilka wierszy konfiguracji, a nie nowy projekt.

| Dział | Widzi dokumenty | Asystent przygotowuje | Model |
|---|---|---|---|
| Sprzedaż | cennik, rabaty, oferty + wspólne | spotkanie, notatkę o kliencie | Claude, po maskowaniu |
| Obsługa klienta | awarie, statusy, reklamacje | spotkanie, notatkę | Claude, po maskowaniu |
| Biuro | sale, delegacje, zamówienia | spotkanie, notatkę | Claude, po maskowaniu |
| Księgowość | windykacja, korekty, płatności | przypomnienie o płatności | tylko model w firmie |
| Zarząd | wszystko | wszystko + dziennik, koszty, uprawnienia | tylko model w firmie |

## Firma nie ma CRM: sprawy prowadzi asystent

Nie trzeba kupować ani wdrażać CRM, żeby asystent pamiętał klientów. **Każdy zatwierdzony wniosek staje się sprawą**: spotkanie, notatka o kliencie albo przypomnienie o płatności, z klientem, terminem i następnym krokiem.

- **Zakładka Sprawy:** dział widzi swoje sprawy, zarząd wszystkie. Filtrowanie po kliencie, rodzaju, dziale i dacie.
- **Bez przepisywania:** handlowiec pisze „umów spotkanie z firmą X we wtorek”, zatwierdza jednym kliknięciem i sprawa jest zapisana.
- **Bezpiecznie:** sprawy są szyfrowane na dysku, a dane osoby można wyszukać, wyeksportować i usunąć jednym poleceniem (RODO).
- **Na później:** gdy firma wdroży CRM albo kalendarz, wniosek po zatwierdzeniu trafi tam przez API, MCP albo n8n zamiast do lokalnej listy. Reszta aplikacji się nie zmienia.

## Pytania pracodawcy

### Jakich agentów używam?

Claude Code jako głównego agenta, a do przeglądów wyspecjalizowanych agentów, którzy pracują równolegle. Każdy dostaje wąskie zadanie i zwraca uwagi z dowodami. Ja je weryfikuję, a każda poprawka błędu dostaje test.

| Agent | Zadanie | Wynik |
|---|---|---|
| Claude Code | główny agent: kod, testy, wdrożenia, prezentacja | cała aplikacja i infrastruktura |
| 3 recenzentów kodu | bezpieczeństwo, jakość, UX | ponad 20 poprawek z testami |
| specjalista UX mobilnego | iPhone SE, iPhone 14, Pixel 7, jasny i ciemny | 22 poprawki na telefonie |
| pentester | przegląd pod kątem ataków | brak luk krytycznych i wysokich, 5 poprawek |

Skille i narzędzia: **Superpowers** (planowanie pracy, systematyczne szukanie przyczyn błędów, równoległe agenty, sprawdzanie przed oddaniem), skill `claude-api` (integracja z Claude), własny skill `ai-security-checklist` w katalogu `skills/`, Claude Design (projekt ekranów), Playwright (zrzuty, testy w przeglądarce, pomiar płynności animacji). Szczegóły: [docs/08](docs/08-jak-powstal-i-pytania.md).

### Gdzie trzymam klucze AI?

| Opcja | Jak działa | Kiedy |
|---|---|---|
| Klucz w zmiennej środowiskowej | klucz w `.env` na serwerze, poza repozytorium, z prawami tylko dla procesu aplikacji; limit wydatków w konsoli dostawcy jako drugi bezpiecznik | to demo: zwykły serwer VPS |
| Federacja tożsamości (Workload Identity Federation) | serwer nie ma żadnego stałego klucza; tożsamość z chmury klienta jest wymieniana na token ważny kilka minut | wdrożenie u klienta w jego chmurze |

Klucz nigdy nie trafia do przeglądarki ani do repozytorium.

### Jak można wywołać AI inaczej niż przez API?

Cztery drogi, ta sama brama: uprawnienia działów, maskowanie i dziennik działają w każdym wariancie. Zmienia się tylko to, gdzie liczy model, a w aplikacji to jedna linia konfiguracji.

| Wariant | Koszt | Dane | Kiedy wybrać |
|---|---|---|---|
| **Model w firmie** (Ollama, np. Bielik) | serwer z kartą graficzną, bez opłat za pytanie | nie opuszczają firmy | dane chronione, księgowość, zarząd |
| **Subskrypcja firmowa** (Claude Team, Microsoft 365 Copilot) | stała opłata za osobę | u dostawcy, na umowie firmowej | szybki start bez własnej aplikacji, mniej kontroli nad działami |
| **Chmura firmy** (Amazon Bedrock, Google Vertex AI w regionie UE) | w ramach umowy chmurowej | region UE, logowanie przez federację tożsamości, bez kluczy | firma już korzysta z AWS albo Google Cloud |
| **API przez bramę** (to demo) | ok. 1 USD na 1000 pytań, twardy limit budżetu | tylko tekst po maskowaniu | własne zasady działów i pełny dziennik |

**Rekomendacja: hybryda.** Dane chronione liczy model w firmie, resztę tani model w chmurze. Brama już to obsługuje.

## Testy

| Co | Ile | Jak uruchomić |
|---|---|---|
| Testy automatyczne | 48 | `npm test` |
| Test dymny wszystkich funkcji na działającym serwerze (także z prawdziwym Claude) | ponad 40 kroków | `npm run smoke`, `BASE_URL=https://compax.tech npm run smoke` |
| CI przy każdej zmianie: testy, `npm audit`, test dymny | przy każdym pushu | [GitHub Actions](.github/workflows/ci.yml) |
| Aktualizacje zależności | co tydzień | Dependabot |

Testy obejmują: logowanie, sesje i blokadę konta, CSRF, uprawnienia działów, wyszukiwanie tylko w dozwolonych dokumentach, maskowanie (także odmienione imiona), wykrywanie danych chronionych (także numery rozbite na kilka wiadomości i numery kart z sumą kontrolną), brak fałszywych alarmów, limity i budżet, wnioski i ich zatwierdzanie, dziennik bez danych osobowych, szyfrowanie na dysku, narzędzie administratora RODO, zgłoszenia ze zrzutem ekranu (odrzucenie plików udających obraz), uprawnienia ustawiane przez zarząd i wyszukiwanie w internecie.

## Bezpieczeństwo

- **Logowanie:** hasła hashowane scryptem, blokada po 5 nieudanych próbach, ten sam komunikat dla złego hasła i nieznanego loginu, sesja w ciasteczku HttpOnly i SameSite=Strict.
- **Przeglądarka:** restrykcyjne CSP bez wyjątków, ochrona CSRF, zero skryptów i czcionek z obcych serwerów, HSTS, Permissions-Policy.
- **Model:** dostaje tylko tekst po maskowaniu; wnioski, które proponuje, serwer sprawdza według działu (ochrona przed prompt injection).
- **Dane na dysku:** szyfrowanie AES-256-GCM, kopia co noc, klucz poza kopią; uruchomienie ze złym kluczem nie nadpisze danych.
- **Koszty:** limit pytań na minutę, limit chmury na dział i twardy budżet miesięczny.
- **Serwer w UE:** Hetzner w Niemczech, HTTPS, firewall, SSH tylko kluczem, aplikacja bez uprawnień administratora.

Model zagrożeń z testem do każdego zabezpieczenia: [docs/07](docs/07-model-zagrozen.md). Zgłaszanie podatności: [SECURITY.md](SECURITY.md).

## RODO

- **Rejestr czynności przetwarzania**, środki z art. 32, kwalifikacja DPIA, procedura naruszenia i AI Act: [docs/06](docs/06-rodo-rejestr-i-ocena-ryzyka.md).
- **Prawa osób jednym poleceniem:** `npm run admin -- szukaj | eksport | usun "Nazwisko"`.
- **Minimalizacja:** do modelu idą tylko zamaskowane dane, dziennik nie zawiera danych osobowych, rozmowa nie jest zapisywana na serwerze.
- **Informacja dla pracowników:** strona [/prywatnosc](https://compax.tech/prywatnosc) w aplikacji.

## Webhooki i automatyzacje: gdzie są użyte

| Gdzie | Co się dzieje | Konfiguracja |
|---|---|---|
| Zatrzymane dane chronione | gdy ktoś wpisze PESEL albo numer konta, administrator dostaje powiadomienie (kto, dział, powód, bez treści) na Teams, Slack albo Telegram | `ALERT_WEBHOOK_URL` w `.env` ([policy.js](server/policy.js)) |
| Przycisk „Zgłoś” | problem, pomysł albo pytanie pracownika idzie od razu do opiekuna: e-mailem przez Resend (ze zrzutem ekranu w załączniku) albo na webhook | `RESEND_API_KEY` + `FEEDBACK_TO` albo `FEEDBACK_WEBHOOK` ([feedback.js](server/feedback.js)) |
| n8n | ten sam przepływ co w aplikacji jako workflow wywoływany webhookiem `POST /webhook/asystent`, z logiem w Google Sheets i powiadomieniem na Telegram; gotowy do importu, w demo nieuruchomiony | [n8n/](n8n/README.md) |
| Brama AI | sama dobiera model do pytania, korzysta z pamięci odpowiedzi, pilnuje budżetu i po jego przekroczeniu przechodzi na tryb bez chmury | `APP_MONTHLY_BUDGET_USD`, `CLOUD_MONTHLY_LIMIT` |
| Wdrożenie i serwer | wdrożenie jednym poleceniem (paczka przez SSH, restart pm2), certyfikaty HTTPS odnawiane automatycznie, kopie co noc przez cron, automatyczne poprawki bezpieczeństwa systemu | [deploy/](deploy/README.md) |
| GitHub | CI przy każdej zmianie, Dependabot co tydzień | [.github/](.github/workflows/ci.yml) |

## Co jeszcze jest w aplikacji

- **Dokumenty od pracowników:** dodawane w aplikacji do bazy działu, od razu dostępne w wyszukiwaniu.
- **Uprawnienia od zarządu:** dla wybranych osób wiedza ogólna (odpowiedź spoza dokumentów, wyraźnie oznaczona) i wyszukiwanie w internecie (Claude, po maskowaniu, ze źródłami).
- **Wybór modelu:** pracownik wybiera spośród dozwolonych w dziale; GPT, Gemini, Mistral, Bielik i Ollama są pokazane jako gotowe do podłączenia.
- **Panel „Co dostał model”:** pracownik widzi dokładnie, co wyszło do modelu.
- **Telefon, tryb ciemny i dostępność:** poprawione po audycie na trzech telefonach.

Firma w demo jest fikcyjna (Kriomar sp. z o.o.), dane są przykładowe. Działa prawdziwy model Claude z budżetem 3 USD miesięcznie.

## Czego brakuje do produkcji

Demo działa na żywo, ale uczciwie: tego jeszcze nie ma i to bym zrobił przed wdrożeniem u klienta.

| Brakuje | Dlaczego ważne | Plan |
|---|---|---|
| Logowanie firmowe (SSO z MFA) | konta lokalne i hasła to najsłabszy punkt | Microsoft Entra ID albo Google Workspace, role z katalogu firmy |
| Podłączony model w firmie | księgowość i zarząd mają dziś tylko odpowiedzi z dokumentów | Ollama z Bielikiem na serwerze z kartą graficzną; integracja w bramie jest gotowa |
| Druga warstwa wykrywania danych osobowych | reguły nie rozumieją kontekstu | Microsoft Presidio + model rozpoznawania nazw dla polskiego |
| Baza danych zamiast plików | jeden serwer, sesje w pamięci (restart wylogowuje) | PostgreSQL z szyfrowaniem, klucz w KMS, sesje w Redis |
| Kopie poza serwerem i monitoring | dziś kopie leżą na tym samym serwerze | Storage Box, alerty o błędach, kosztach i dostępności |
| Uruchomiony n8n | workflow jest tylko przygotowany | wpięcie zgłoszeń i alertów do istniejących kanałów firmy |
| Wysyłka e-maili ze zgłoszeń | wymaga klucza Resend | dodanie klucza i zweryfikowanej domeny nadawcy |
| Testy z prawdziwymi użytkownikami | demo sprawdzali agenci i testy automatyczne | pilotaż w jednym dziale, pomiar przed i po ([plan](docs/05-plan-wdrozenia.md)) |

## Dokumentacja dla klienta

| Dokument | Dla kogo |
|---|---|
| [Przegląd dla zarządu](docs/01-przeglad-dla-klienta.md) | zarząd: co robi, czego nie robi, jak chroni dane |
| [Bezpieczeństwo i RODO](docs/02-bezpieczenstwo-i-rodo.md) | IT, inspektor ochrony danych: przepływ, klasyfikacja, gdzie są dane, szyfrowanie, dostęp |
| [Instrukcja administratora](docs/03-instrukcja-administratora.md) | administrator: konfiguracja, użytkownicy, dokumenty, kopie i odtworzenie, rotacja kluczy |
| [Koszty](docs/04-koszty.md) | zarząd, finanse: koszt pytania, co go obniża, model w firmie, przykładowy miesiąc |
| [Plan wdrożenia](docs/05-plan-wdrozenia.md) | zarząd i kierownicy działów: etapy, miary, co przygotowuje klient |
| [RODO: rejestr i ocena ryzyka](docs/06-rodo-rejestr-i-ocena-ryzyka.md) | inspektor ochrony danych, prawnik: rejestr czynności, środki techniczne, prawa osób, naruszenia, AI Act |
| [Model zagrożeń](docs/07-model-zagrozen.md) | IT, bezpieczeństwo: ataki, zabezpieczenia, testy, ryzyka do zamknięcia |
| [Polityka bezpieczeństwa](SECURITY.md) | wszyscy: jak zgłosić podatność |
| [Jak powstał projekt i pytania, które mogą paść](docs/08-jak-powstal-i-pytania.md) | rekruter, klient: agenci AI, skille, testy, automatyzacje, odpowiedzi na typowe pytania |
| [Koncepcja (PDF)](Platforma_AI_dla_firmy_wielodzialowej.pdf) | pełny opis rozwiązania |

## Uruchomienie (bez klucza API, 1 minuta)

```bash
npm install
npm start    # http://localhost:3000 – ekran startowy, logowanie pod /app
npm test     # testy automatyczne (node --test), bez dodatkowych zależności
npm run smoke                              # test dymny wszystkich funkcji na http://localhost:3000
BASE_URL=https://compax.tech npm run smoke  # to samo na serwerze produkcyjnym
```

Zaloguj się jako jeden z pracowników i użyj podpowiedzi pod czatem.

## Konta demo

| Login | Osoba | Dział | Co sprawdzić |
|---|---|---|---|
| `a.lis` | Anna Lis | sprzedaż | pytanie o rabat (Claude, ze źródłem), spotkanie z zamaskowanym nazwiskiem i zatwierdzeniem |
| `m.wojcik` | Marek Wójcik | obsługa klienta | czas reakcji na awarię, reklamacje |
| `e.nowak` | Ewa Nowak | biuro | rezerwacja sali, delegacje |
| `t.kaczmarek` | Tomasz Kaczmarek | księgowość | windykacja; nic nie wychodzi do chmury, PESEL zatrzymany |
| `j.zielinski` | Jan Zieliński | zarząd | zakładka Dziennik: trasa, model i koszt każdego pytania, budżet miesiąca, zgłoszenia pracowników |

Hasła kont demo są wypisane na ekranie logowania (rozwijana lista „Konta demo”), bo firma i dane są fikcyjne. W kodzie są tylko hashe (scrypt z solą, `server/security.js`), więc wyciek repozytorium nie ujawnia haseł. Własne hasło: `node -e "import('./server/security.js').then(m => console.log(m.hashPassword('TwojeHaslo')))"` i wklej wynik do `server/users.js`. W produkcji logowanie przejmuje SSO (Microsoft Entra / Google Workspace).

## Warianty dostawcy AI

Skopiuj `.env.example` do `.env` i ustaw `AI_PROVIDER`:

| Wariant | `.env` | Kiedy |
|---|---|---|
| `mock` (domyślny) | brak klucza | pokaz architektury bez kosztów; odpowiedzi = najtrafniejsze fragmenty bazy wiedzy |
| `anthropic` | `ANTHROPIC_API_KEY`; modele dobierane automatycznie (`ANTHROPIC_MODEL_CHEAP`, `ANTHROPIC_MODEL_STRONG`), `MODEL` ustawia jeden na sztywno | pełne odpowiedzi, narzędzia wybierane przez model |
| `openai` | `OPENAI_API_KEY`, `MODEL=gpt-4o-mini` | to samo, inny dostawca – zmiana w jednym miejscu |
| `ollama` | `OLLAMA_URL=http://localhost:11434`, `OLLAMA_MODEL=llama3.1` (np. Bielik) | model w firmie, dane nie opuszczają serwera; obsługuje dane chronione |

Zmiana dostawcy nie wymaga zmian w kodzie agentów – na tym polega rola bramy AI.

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
public/app.html      – aplikacja: logowanie, czat, sprawy z filtrami, dokumenty, dziennik i uprawnienia (app.js, app.css; bez frameworka)
public/prywatnosc.html – informacja o przetwarzaniu danych i zasady korzystania
server/feedback.js   – zgłoszenia „Zgłoś”: walidacja, zrzut ekranu, e-mail (Resend) albo webhook
scripts/admin.mjs    – narzędzie administratora: RODO (szukaj, eksport, usuń) i zmiana klucza szyfrowania
tests/               – testy automatyczne (npm test) i test dymny działającej instalacji (npm run smoke)
skills/              – przykładowy skill dla Claude Code: checklista bezpieczeństwa wdrożenia AI
```

## Przebieg jednego pytania

```mermaid
sequenceDiagram
    actor P as Pracownik
    participant C as Compax (serwer)
    participant D as Dokumenty działu
    participant M as Model AI
    P->>C: Pytanie (dział i rola z sesji)
    C->>D: Szukaj tylko w dziale i wspólnych
    D-->>C: Pasujące fragmenty
    Note over C: Maskuje dane osobowe, ocenia poziom
    alt dane chronione (PESEL, konto, zdrowie)
        C-->>P: Nie wysłano, nic nie wychodzi z firmy
    else jawne lub wewnętrzne
        C->>M: Tekst z etykietami „osoba 1”, „telefon 1”
        M-->>C: Odpowiedź + propozycja akcji
        Note over C: Przywraca dane, sprawdza akcję według działu
        C-->>P: Odpowiedź ze źródłem, wniosek czeka na „Zatwierdź”
    end
    Note over C: Dziennik: kto, dokąd, jakim modelem, ile kosztowało
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
| Pamięć odpowiedzi | pytanie bez danych osobowych i bez akcji, na które już odpowiedziano z tych samych dokumentów, jest zwracane z pamięci bez kosztu; klucz zawiera dział i wersję dokumentów, ważność 7 dni | automatycznie |
| Koszty | tokeny z odpowiedzi dostawcy i koszt z cennika w logu każdego zapytania; zarząd widzi sumy w podziale na działy i budżet w bieżącym miesiącu | `PRICING_JSON`, `APP_MONTHLY_BUDGET_USD` |
| Alert | zatrzymana wiadomość = wpis `blocked` bez treści i powiadomienie administratora | `ALERT_WEBHOOK_URL` |

Panel „Co dostał model” pokazuje poziom, dokąd poszło zapytanie (zielona kropka: serwer firmy, bursztynowa: chmura) i szacowany koszt.

## Dokumenty i dane

- **Dodawanie dokumentów.** Pracownik dodaje plik .md lub .txt w zakładce „Dokumenty działu” do bazy swojego działu, zarząd do dowolnego działu i do wspólnych. Dokument jest od razu dostępny w wyszukiwaniu i tylko dla działu, do którego trafił. Usunąć go może autor albo zarząd. Każde dodanie i usunięcie jest w dzienniku. Rozmowy na czacie nie trafiają do bazy wiedzy; dodanie dokumentu jest świadomą decyzją pracownika.
- **Szyfrowanie na dysku.** Gdy ustawiony jest `DATA_KEY`, wszystkie pliki w `data/` (sprawy, dziennik, liczniki, pamięć odpowiedzi, wgrane dokumenty) są zapisywane jako AES-256-GCM z losowym wektorem i znacznikiem integralności. Zapis atomowy, prawa 600.
- **Kopie zapasowe.** `deploy/backup.sh --install` dodaje codzienną kopię zaszyfrowanych danych, przechowywaną 14 dni. Klucz nie jest częścią kopii.

## Co jest uproszczone (i jak wygląda w produkcji)

| W demo | W produkcji |
|---|---|
| hasła z hashem scrypt, sesja w ciasteczku HttpOnly, blokada konta, lista użytkowników w kodzie | SSO Microsoft Entra / Google Workspace, role z katalogu firmy, sesje w Redis |
| wyszukiwanie leksykalne | embeddingi + PostgreSQL/pgvector lub Qdrant, uprawnienia do poszczególnych dokumentów |
| maskowanie i klasyfikacja regułami | Microsoft Presidio + NER dla polskiego, polityka dla każdego działu w konfiguracji |
| akcje zapisują do pliku | API kalendarza/poczty/faktur lub MCP, z zatwierdzeniem |
| dane w plikach JSON zaszyfrowanych AES-256-GCM, klucz w `.env`, codzienna kopia na tym samym serwerze | PostgreSQL z szyfrowaniem, klucz w KMS, kopie poza serwerem (np. Hetzner Backup, S3 z wersjonowaniem) |
| dokumenty .md/.txt dodawane w aplikacji do bazy działu | import PDF/DOCX, synchronizacja z SharePointem / Dyskiem Google, zatwierdzanie dokumentów przez kierownika |
| logi w JSON | baza z retencją, alerty błędów (Telegram/Teams), panel kosztów dla każdego działu |
| jeden proces Node | serwer w UE, HTTPS, sekrety w sejfie, kopie zapasowe |

## Wdrożenie na VPS

Gotowe skrypty i instrukcja krok po kroku dla Hetzner Cloud (Caddy + HTTPS, pm2, firewall, użytkownik bez uprawnień): [deploy/README.md](deploy/README.md).

## Licencja

© 2026 Piotr Bednarski, wszelkie prawa zastrzeżone. Kod opublikowany do oceny w procesie rekrutacyjnym; wykorzystanie poza tym celem wymaga zgody autora. Szczegóły w pliku `LICENSE`.

Autor: Piotr Bednarski, październik 2026.
