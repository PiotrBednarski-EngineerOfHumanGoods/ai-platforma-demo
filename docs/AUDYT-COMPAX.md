# Audyt Compax: aplikacja, prezentacja, architektura i gotowość do wdrożenia

Data: 2026-10-14 · Wersja kodu: 1.2.1 (commit `baca51b`) · Prezentacja: 22 slajdy (wersja 32 w Claude Slides; plik `Compax – Prezentacja.pdf` z 22:45 ma te same 22 slajdy)

## Jak przeprowadzono audyt

| Obszar | Kto i jak | Dowody |
|---|---|---|
| Architektura i kod | agent „Tech Lead”: lektura całego `server/`, `scripts/`, `deploy/`, `.github/`, kluczowych części `public/`; eksperymenty na kopii danych | ścieżki i numery linii w tabelach |
| Bezpieczeństwo i RODO | agent „pentester/IOD”: **aktywne testy wyłącznie na lokalnej instancji** (port 4101), harness przechwytujący ruch do Anthropic i Resend (nic nie zostało wysłane) | `scratchpad/audit-sec/` |
| AI/RAG | agent „AI engineer”: skrypty importujące moduły, pełny przepływ `/api/chat` z atrapą modelu | `scratchpad/audit-ai/` |
| Zgodność prezentacji z kodem | agent „audytor zgodności”: każde istotne zdanie z 22 slajdów porównane z kodem i testami | tabela w sekcji 8 |
| Polszczyzna | agent „redaktor”: wszystkie slajdy i notatki, podglądy 19 slajdów | sekcja 9 |
| Ścieżki użytkownika | agent „QA”: Playwright + Chrome na lokalnej instancji, zrzuty ekranu, widok mobilny | sekcja 3.2 |
| Weryfikacja | ja (koordynator): powtórzenie kluczowych ustaleń w kodzie i lokalnie, **odczyt (bez zmian) nazw zmiennych `.env` i crona na produkcji** | oznaczone „zweryfikowane osobiście” |

**Ograniczenia, które trzeba znać:**
- Lokalnie nie ma klucza API, więc wszystko, co zależy od zachowania prawdziwego modelu Claude (posłuszeństwo instrukcjom, odporność na prompt injection, jakość odpowiedzi), jest **NIEZWERYFIKOWANE**. Sprawdzono, co brama wysyła do modelu i co robi z jego odpowiedzią.
- Na produkcji nie wykonano żadnych zapisów ani ataków. Jedyne operacje: `curl -I` strony głównej i odczyt nazw zmiennych `.env` (bez wartości sekretów) oraz listy plików crona.
- Przeglądy wykonały agenty AI. **To nie jest niezależny audyt bezpieczeństwa ani opinia prawna.** Ustalenia o największej wadze zostały jednak powtórzone osobiście (oznaczone).
- Ocena wizualna slajdów: podgląd nie rysuje strzałek (slajd 5) ani stylu tabel motywu; PDF przeczytano tekstowo.

---

## 1. Executive summary

**Odpowiedź na najważniejsze pytanie:** Compax jest **działającym, przemyślanym demonstratorem z prawdziwym rdzeniem**, a nie makietą — ale prezentacja w kilku kluczowych miejscach **obiecuje więcej, niż realizuje aplikacja**, a do komercyjnego wdrożenia brakuje kilku rzeczy, które nie są kosmetyczne.

Co jest prawdziwe i dobre (potwierdzone w kodzie i testach):
- jedna brama AI dla wielu działów, z uprawnieniami sprawdzanymi **przed** wyszukiwaniem (sprzedaż nie dostanie fragmentów księgowości — potwierdzone lokalnie i w testach);
- model niczego nie wykonuje sam: serwer przepuszcza tylko znane narzędzia działu, a wykonanie wymaga kliknięcia „Zatwierdź”;
- maskowanie typowych danych (e-mail, telefon 3-3-3, PESEL, konto, karta, imię z listy + nazwisko, „pan X”) i odmaskowanie po stronie serwera;
- PESEL i numer konta w typowym zapisie są zatrzymywane niezależnie od wybranego modelu;
- solidna warstwa webowa: CSP bez `unsafe-inline`, CSRF, SameSite=Strict, scrypt, brak znalezionego XSS/IDOR, utwardzony serwer;
- 51 testów automatycznych przechodzi, CI zielone; produkcja ma Sonnet do analiz, budżet 3 USD, szyfrowanie danych i cron kopii (zweryfikowane osobiście).

Co podważa prezentację (potwierdzone, w tym osobiście):
1. **„Dane chronione nigdy nie wychodzą z firmy” — nieprawda.** Fragmenty dokumentów nie są klasyfikowane, tylko maskowane: dokument z „chorobą”, „zwolnieniem lekarskim” czy pensją idzie do Claude'a. Zgłoszenia (z PESEL-em i zrzutem ekranu) idą e-mailem przez Resend (USA). Historię rozmowy dostarcza przeglądarka, a klasyfikacja pomija wiadomości „asystenta”.
2. **„Nie da się tego obejść” — nieprawda.** Filtr regułowy omijają: zwykłe sformułowania o zdrowiu („choruje na cukrzycę”), hasło („moje hasło to …”), PESEL słownie lub cyframi Unicode, wynagrodzenie zapisane małą literą.
3. **„Bez fałszywych alarmów” — nieprawda.** „Diagnoza usterki agregatu chłodniczego” (typowe zdanie w firmie serwisowej) i 11-cyfrowy numer zamówienia są blokowane.
4. **„Nazwisko zostaje w firmie”, „bez nazwisk i telefonów” — częściowo.** „Krystyna Nowak”, „Kowalski” bez imienia, telefony 2-2-2 i stacjonarne, adresy przechodzą bez maskowania i trafiają też do dziennika.
5. **„Nie da się podszyć pod pracownika” — nieprawda na demo:** hasła wszystkich kont, łącznie z zarządem, są w kodzie strony logowania. Każdy odwiedzający może zmieniać działy, czytać dziennik i zgłoszenia innych, wgrywać dokumenty.
6. **„Gotowe do oddania klientowi”** przeczy slajdowi 20 („Czego brakuje do produkcji”).

Co blokuje wdrożenie komercyjne: brak klasyfikacji dokumentów i zgłoszeń, przekraczalny budżet (test: 5,3× przy równoległych pytaniach), wnioski i sesje w pamięci procesu (restart je kasuje), dziennik ograniczony do 500 wpisów całej firmy (panel „miesięczny” liczy z niego), konta w kodzie, brak timeoutów do API, zmiana klucza szyfrowania psuje ustawienia z panelu.

Jako **zadanie rekrutacyjne** projekt jest ponadprzeciętny (działa na żywo, ma testy, CI, dokumentację, uczciwą listę braków). Ryzyko dla kandydata nie leży w kodzie, tylko w **bezwzględnych sformułowaniach**, które doświadczony rozmówca obali jednym zdaniem. Po złagodzeniu ich i naprawie P0 (szacunkowo 1–2 dni pracy) prezentacja będzie w pełni obronna.

---

## 2. Czy rozwiązanie realizuje zadanie rekrutacyjne

Zadanie: *„Firma ma wiele działów, chce korzystać z jednej AI do usprawniania procesów i pracy w czacie. Nie ma CRM i nie chce go kupować. Jak byś to zrobił?”*

| Pytanie | Ocena | Uzasadnienie i dowód |
|---|---|---|
| Czy odpowiada bezpośrednio na zadanie? | **Częściowo tak** | Część „jedna AI, wiele działów, czat” — zrobiona dobrze (`server/app.js:65-67,142`, `policy.js:27-48`). Część „usprawnianie procesów” i „bez CRM” — płytka (niżej). |
| Jedna platforma dla wielu działów? | **Tak** | Wspólne logowanie, brama, dziennik, budżet; dokumenty, narzędzia i polityka modeli per dział. |
| Izolacja danych między działami | **Poprawna w wyszukiwaniu** | Filtr działu przed rankingiem (`knowledge.js:30`). Wyjątek: zarząd z włączoną chmurą wysyła do chmury fragmenty księgowości (`app.js:65-67` + `policy.js`), choć księgowość ma politykę „tylko lokalnie” (S-05). |
| Uprawnienia użytkowników | **Poprawne w API** | Endpointy zarządu sprawdzają dział (403 dla innych), brak IDOR. Na demo hasło zarządu jest publiczne. |
| Przechowywanie spotkań, notatek, wniosków | **Słabe** | Wnioski oczekujące tylko w pamięci (`store.js:56`); po zatwierdzeniu każdy rodzaj zapisuje się jako notatka tekstowa w `cases.json` (`tools.js:13-27`); typ sprawy zgaduje frontend regexem; termin bywa zapisany jako „jutro”. |
| Zamiast CRM czy uproszczony CRM? | **Ani jedno, ani drugie** | To dziennik notatek „tylko dopisywanie”: brak encji klienta, statusu, właściciela, edycji, przypomnień. Najważniejsze: **asystent nie czyta spraw** (`app.js:42` indeksuje tylko dokumenty), więc „co ustaliliśmy z Fregatą?” nie znajdzie notatki — wbrew README („żeby asystent pamiętał klientów”). |
| Bezpieczna obsługa wielu działów przez jednego asystenta | **Tak, z lukami** | Brama i lista narzędzi per dział działają; luki: dokumenty bez klasyfikacji, pamięć podręczna współdzielona w dziale z personalizacją (A4). |
| Automatyzacja czy odpowiadanie na pytania? | **Głównie odpowiadanie** | Zatwierdzony wniosek nie trafia do kalendarza ani nie wysyła przypomnienia (`tools.js:21,25`). n8n to osobny, niepodłączony plik workflow. |
| Rozszerzalność | **Średnia** | Nowy dział = zmiany w 5 miejscach kodu (`users.js`, `tools.js`, `policy.js`, `public/app.js`, `knowledge/`); `"zarzad"` zaszyte 17 razy. Nowy pracownik = edycja kodu i wdrożenie. Punkt zaczepienia integracji (`executeTool`) jest, ale bez kolejki i ponowień. |
| Sens ekonomiczny dla 10–50 osób | **Wątpliwy przy 10–20, możliwy przy 50** | Hosting ~4 €/mies., API grosze. Koszt dominujący to utrzymanie własnej aplikacji (konta w kodzie, brak SSO, monitoringu, kopii poza serwerem). Abonament zespołowy to ~25–30 USD/os./mies. |

**Czy rozwiązanie jest przerośnięte?** Tak, nierówno: dużo pracy w bramę na 4 dostawców, cache, budżet, zgłoszenia ze zrzutami, e-mail przez Resend, landing i 8 dokumentów; mało w rdzeń zadania (proces i „zamiast CRM”).

**Prostsza architektura (rekomendacja do omówienia z klientem):**
- *Wariant A, 10–25 osób, „kupić zamiast budować”:* Claude Team lub Copilot z projektem/agentem per dział, dokumenty w SharePoint/Dysku, rejestr spraw w Google Sheets/Airtable, n8n łączy czat lub formularz z arkuszem i kalendarzem. Mniej kontroli per dział, prawie zero utrzymania.
- *Wariant B, 25–50 osób lub wymogi RODO, „cienka własna brama”:* zostawić obecny przepływ, ale jedna baza SQLite (sesje, wnioski, sprawy z encją klienta, statusem i terminem ISO, dziennik z retencją czasową), OIDC zamiast `users.js`, sprawy w wyszukiwaniu, 1–2 realne integracje (kalendarz, e-mail) przez kolejkę. Usunąć lub odłożyć OpenAI, zrzuty w zgłoszeniach, Resend.

---

## 3. Audyt funkcjonalności aplikacji

### 3.1. Co działa, co częściowo, co tylko w dokumentacji

| Funkcja | Status | Dowód |
|---|---|---|
| Logowanie, sesje, wylogowanie, blokada | POTWIERDZONE (z zastrzeżeniami) | testy, `security.js`; blokada per (konto, IP), w pamięci |
| Dokumenty działu i wspólne, wgrywanie | POTWIERDZONE | `app.js:95-125`, testy docs |
| Czat z odpowiedzią ze źródłem | POTWIERDZONE | smoke, testy |
| Maskowanie i odmaskowanie | CZĘŚCIOWE | `pii.js`; luki w sekcji 6 |
| Blokada danych chronionych | CZĘŚCIOWE | typowe zapisy PESEL/konta: tak; zdrowie, płace, hasła: tylko po słowach kluczowych |
| Wnioski i zatwierdzanie | POTWIERDZONE, nietrwałe | `app.js:220-267`; kolejka w RAM |
| Sprawy (zamiast CRM) | CZĘŚCIOWE | notatki bez typu, statusu, klienta; AI ich nie czyta |
| Dziennik, koszty, budżet | CZĘŚCIOWE | dziennik 500 wpisów; panel liczy z obciętego dziennika; budżet przekraczalny |
| Panel zarządu: działy, chmura, internet, wiedza ogólna | POTWIERDZONE | testy panelu, zweryfikowane w przeglądarce (3.2) |
| Wiedza ogólna i internet | POTWIERDZONE w kodzie, NIEZWERYFIKOWANE z prawdziwym modelem | `providers.js`, testy |
| Model lokalny (Ollama/Bielik) | CZĘŚCIOWE / PLANOWANE | kod działa na atrapie; domyślny model `llama3.1`; brak testu i serwera |
| n8n | PLANOWANE | tylko plik `n8n/asystent-firmowy.json`, aplikacja go nie wywołuje |
| Zgłoszenia ze zrzutem | POTWIERDZONE, z problemem RODO | S-02 |
| Prawa osób (RODO) w `admin.mjs` | CZĘŚCIOWE | dopasowanie podciągiem, eksport niepełny (S-14) |
| Kopie zapasowe | CZĘŚCIOWE | cron na produkcji jest (zweryfikowane osobiście), kopie i klucz na tym samym serwerze, brak testu odtworzenia |

### 3.2. Ścieżki użytkownika w przeglądarce

Prawdziwy Chrome (Playwright), lokalna instancja w trybie pokazowym (bez klucza API), widok komputerowy i telefon 390×844. Zrzuty: `scratchpad/audit-e2e/*.png`. Konsola: brak błędów JS.

| # | Ścieżka | Wynik | Status |
|---|---|---|---|
| 1 | Strona startowa | ładuje się, intro tylko przy pierwszej wizycie, linki działają | OK |
| 2 | Logowanie handlowca, błędne hasło | ten sam komunikat dla złego hasła i nieznanego loginu; login odporny na wielkość liter i spacje | OK |
| 3 | Dokumenty i pytanie „Jaki rabat mogę dać sam?” | lista: dokumenty sprzedaży i wspólne; odpowiedź ze źródłem `sprzedaz/cennik-i-oferty.md`; dokumentu nie da się otworzyć z listy | OK / UWAGA |
| 4 | Dostęp do innego działu (UI i API) | czat: „w dokumentach działu nie ma odpowiedzi”; API: `/logs`, `/usage`, `/admin/*`, `/feedback` → 403; upload do księgowości → 403 | **OK** |
| 5 | Maskowanie spotkania z panem Kowalskim i telefonem | panel „Co dostał model” pokazuje etykiety; wniosek czeka; **ale pełny telefon trafia do tematu wniosku, a potem do Spraw** (B2), „z kim: Janem Kowalskim” (B5) | OK / UWAGA |
| 6 | PESEL (Tomasz) | zatrzymane: 8 zapisów (spacje, myślniki, kropki, rozbicie bez tekstu); **nie zatrzymane: rozbicie z tekstem pomiędzy (B1), litera O zamiast zera (B6)** | **BŁĄD** |
| 7 | Zatwierdzanie, ponowne, Odrzuć | trafia do Spraw raz; ponowne zatwierdzenie przez API → 404; Odrzuć działa; **podwójne kliknięcie: „✓ undefined” i komunikat o błędzie** (B3) | BŁĄD (UI) |
| 8 | Zarząd: dziennik, uprawnienia, chmura; Anna bez dostępu | w dzienniku brak nazwiska, telefonu i pełnego PESEL-u z kroków 5–6 (są fragmenty PESEL-u z B1); przeniesienie Ewy działa od razu w obie strony; przełącznik chmury działa i trafia do dziennika; Anna nie ma dziennika w UI ani API | OK / UWAGA |
| 9 | Zgłoś, wylogowanie | zgłoszenie zapisane z zamaskowaną treścią; po wylogowaniu 401; **odświeżenie strony przy ważnej sesji wraca do logowania** (B9, zweryfikowane w kodzie: `init()` nie sprawdza sesji) | OK / UWAGA |
| 10 | Telefon 390×844, ludzik | brak poziomego przewijania; ludzik bez czarnej ramki (Chromium); karta wniosku częściowo pod polem wpisywania, „Zgłoś” zasłania tekst (B10) | OK / UWAGA |

Błędy z przeglądarki (dodane do listy poprawek w sekcji 11):

| ID | Waga | Gdzie | Opis | Poprawka |
|---|---|---|---|---|
| B1 | P1 | `policy.js` `classify()` | PESEL rozbity na dwie wiadomości z tekstem pomiędzy przechodzi i trafia w historii do modelu | sklejać kolejne ciągi cyfr z wiadomości i sprawdzać sumę kontrolną (częściowo pokrywa P1-1) |
| B2 | P1 | `tools.js:38` | temat wniosku = pierwsze 80 znaków wiadomości → pełny telefon klienta w Sprawach i na dysku (zweryfikowane w kodzie; przy prawdziwym modelu NIEZWERYFIKOWANE) | temat bez danych kontaktowych (maskowanie lub usuwanie numerów) |
| B3 | P1 | `public/app.js` (handler `[data-a]`) | podwójne „Zatwierdź”: sprawa zapisana raz, ale UI pokazuje „✓ undefined” | blokada przycisku po kliknięciu; przy błędzie nie zmieniać statusu |
| B4 | P2 | dziennik | nieudane logowanie na nieistniejące konto: „null” w kolumnie „Kto” | „nieznany login” |
| B5 | P2 | `tools.js` | klient zapisany w narzędniku („Janem Kowalskim”), także w Sprawach i sortowaniu | normalizacja do mianownika albo nazwa od modelu |
| B6 | P2 | `policy.js`, `pii.js` | „44O514O1458” omija wykrycie | normalizacja O→0, l/I→1 w ciągach cyfr |
| B7 | P2 | `/api/admin/users/:id` | przeniesienie i powrót zmienia rolę („asystentka biura” → „pracownik biura”) | przy powrocie do działu z `users.js` usuwać nadpisanie |
| B8 | P2 | dziennik | „ewa: Biuro → Sprzedaż” zamiast imienia; etykieta „Zmiana modeli działu” niezręczna | imię i nazwisko; „Chmura dla działu” |
| B9 | P2 | `public/app.js` `init()` | odświeżenie strony wylogowuje z UI mimo ważnego ciasteczka | sprawdzić sesję przy starcie (np. `GET /api/me`) |
| B10 | P2 | telefon, czat | karta wniosku pod polem wpisywania, „Zgłoś” zasłania tekst | większy dolny odstęp, przewinięcie do karty, „Zgłoś” w menu na telefonie |
| B11 | P2 | panel zarządu | bez klucza API przełącznik pokazuje „Claude po maskowaniu”, choć chmury nie ma | „chmura niedostępna (brak klucza)” |
| U1 | P2 | zakładka dokumentów | listy dokumentów nie da się otworzyć ani podejrzeć | podgląd treści dokumentu |

---

## 4. Audyt architektury

Format: ID · waga · lokalizacja · problem · poprawka · pracochłonność · weryfikacja.

| ID | Waga | Lokalizacja | Problem | Poprawka | Prac. | Weryfikacja |
|---|---|---|---|---|---|---|
| F1 | P1 | `server/app.js:42`, README | Asystent nie czyta spraw; deklaracja „pamięta klientów” fałszywa | indeksować sprawy per dział albo narzędzie „szukaj spraw” | 0,5–1 d | test: zapis sprawy → pytanie o klienta → sprawa w źródłach |
| F2 | P1 | `app.js:356-371`, `tools.js:37` | Brak daty w prompcie; termin zapisany jako „jutro” | data i strefa w prompcie, normalizacja do ISO na serwerze | 0,5 d | test jednostkowy terminu |
| F3 | P1 | `scripts/admin.mjs:15` | Rotacja `DATA_KEY` pomija `roles`, `flags`, `deptcloud` → po rotacji ustawienia z panelu znikają, dział wraca do chmury (**zweryfikowane osobiście**: stała lista plików) | rotować wszystkie `*.json` w `DATA_DIR` | 1 h | test admin z ustawieniami panelu |
| F4 | P1 | `store.js:58,68-79` | Dziennik = 500 ostatnich zdarzeń całej firmy; panel „miesięczny” liczy z niego (**zweryfikowane osobiście**) | agregaty z `usage`, dziennik z retencją czasową | 0,5–1 d | test 600 wpisów |
| F5 | P1 | `security.js:90-97`, `app.js:56,64,78` | Limity per IP blokują całe biuro za NAT (10 pomyłek kogokolwiek = 15 min blokady wszystkich; 30 pytań/min na biuro) | limit pytań per użytkownik, logowań per konto, wysoki próg IP | 2–3 h | test dwóch kont z jednego IP |
| F7 | P1 | `deploy/start-app.sh`, `store.js:13-16` | Szyfrowanie domyślnie wyłączone, zły klucz po cichu = jawny JSON (na produkcji klucz **jest** ustawiony — zweryfikowane) | fail-fast przy `NODE_ENV=production`, generowanie klucza w skrypcie | 1 h | start bez klucza → kod ≠ 0 |
| F8 | P2 | `store.js:56`, `security.js:33` | Wnioski i sesje w pamięci; restart/wdrożenie wylogowuje i kasuje wnioski (**zweryfikowane**); deploy/README obiecuje „bez przerwy” | SQLite / plik | 0,5 d | test restartu |
| F9 | P2 | `app.js:261-266` | Zatwierdzenie nietransakcyjne (usunięcie z kolejki przed zapisem) | najpierw zapis, potem zdjęcie z kolejki | 2 h | test z błędem zapisu |
| F10 | P2 | `providers.js:33-65`, `feedback.js:48` | Brak timeoutów i ponowień (domyślnie ~300 s), rezerwacja budżetu zablokowana | `AbortSignal.timeout(30s)`, 1 ponowienie na 429/5xx | 2 h | atrapa z opóźnieniem |
| F12 | P2 | `app.js:107-116`, `store.js` `addDoc` | Pracownik może nadpisać cudzy dokument w dziale i przejąć autorstwo | 409, jeśli autor inny | 30 min | test |
| F13 | P2 | `store.js:62` | `recordCloud` kasuje koszty z poprzednich miesięcy (**zweryfikowane osobiście**) | nie filtrować starszych miesięcy | 15 min | test |
| F14 | P2 | `deploy/backup.sh` | Kopie i klucz na tym samym serwerze, brak testu odtworzenia | kopia poza serwer, test odtworzenia | 0,5 d | skrypt odtwarzający + smoke |
| F15 | P2 | `store.js:29-42` | Zły klucz → praca na pustych danych, rozjazd z kopią | fail-fast przy błędzie odszyfrowania | 1 h | test |
| F16 | P2 | `users.js` | Konta w kodzie, brak resetu hasła | `users.json` + polecenia admina, docelowo OIDC | 0,5–1 d | test |
| F17 | P2 | `app.js:25`, `index.js:5` | `trust proxy` + `HOST=0.0.0.0`: bez proxy XFF obchodzi limity (potwierdzone lokalnie; za Caddy prawdopodobnie bezpieczne — NIEZWERYFIKOWANE) | `trust proxy` tylko na żądanie, domyślnie 127.0.0.1 | 15 min | test XFF |
| F18 | P2 | `policy.js:35-41`, `app.js` | Wielokrotne synchroniczne odczyty i deszyfrowanie plików na każde żądanie | SQLite (rozwiązuje też F4, F8, F13) | 1–2 d | test obciążeniowy |
| F19 | P2 | całość | Bardzo długie jednolinijkowce, brak lintera, logów strukturalnych, `/health`, monitoringu; martwy kod `role === "admin"` (`app.js:346`) | ESLint, pino, `/health`, uptime monitor | 0,5 d | CI z lintem |

Mocne strony architektury: kolejność „uprawnienia → wyszukiwanie → maskowanie → polityka → model → bramka akcji”, zapis atomowy tmp+rename, synchroniczny read-modify-write w jednym procesie eliminuje wyścigi (poza `admin.mjs`), mały zestaw zależności (jedna: Express).

---

## 5. Audyt bezpieczeństwa i ochrony danych

### 5.1. Ustalenia

| ID | Waga | Lokalizacja | Problem | Dowód | Poprawka | Prac. |
|---|---|---|---|---|---|---|
| S-01 | **P0** | `app.js:147,156`, `policy.js` | Fragmenty dokumentów nie przechodzą klasyfikacji; zdrowie, płace, adresy, nazwiska małą literą idą do Claude'a | lokalny harness: dokument z „choruje na cukrzycę, zwolnienie lekarskie, wynagrodzenie 7200 zł” → `route: external, level: public`; **zweryfikowane osobiście w kodzie** (fragmenty tylko `mask()`, `classify()` tylko na wiadomościach `user`) | `classify()` na fragmentach i całej historii; skan przy wgrywaniu; podgląd wysłanych fragmentów | 0,5–1 d |
| S-02 | **P0** | `server/feedback.js` | Zgłoszenia bez klasyfikacji; treść (z PESEL-em) i zrzut idą do Resend (USA); Resend nie jest w rejestrze | przechwycone żądanie do api.resend.com z PESEL-em w temacie i załącznikiem | klasyfikacja; e-mail tylko „nowe zgłoszenie w panelu”, bez treści i zrzutu; wpis w rejestrze | 2–4 h |
| S-06 | **P0 dla demo** | `public/app.html:67-71` | Hasła wszystkich kont (z zarządem) w kodzie strony; stan wspólny dla wszystkich odwiedzających | **zweryfikowane osobiście** | konto zarządu tylko do odczytu albo hasło przekazane osobno; reset danych demo co noc; informacja „nie wpisuj prawdziwych danych” | 0,5 d |
| S-03 | P1 (P0 dla twierdzenia) | `policy.js:59,72`, `app.js:156` | Obejścia filtra: cyfry Unicode, zapis słowny, litera O, podział z tekstem pomiędzy, sfałszowana historia „asystenta”, „ile zarabia kasia”, „dowód abc123456”, „moje hasło to …” | harness; **zweryfikowane osobiście**: „Kowalski choruje na cukrzycę”, „moje hasło to Lato2026!”, „ile zarabia kasia z obsługi” → `public` | normalizacja NFKC, usuwanie znaków formatujących, historia po stronie serwera, flaga `i`; docelowo NER; uczciwy opis ryzyka resztkowego | 1–2 d |
| S-04 | P1 | `pii.js` | Maskowanie nie łapie: imion spoza listy 76, nazwisk bez imienia, małej litery, telefonów 2-2-2 i stacjonarnych, adresów, „(at)”; częściowe maskowanie numeru | **zweryfikowane osobiście**: „Krystyna Nowak…”, „Zadzwoń do Kowalskiego…”, „Zenon Malinowski, ul. Długa 5” bez zmian | reguły na adresy i telefony, słownik imion/nazwisk z odmianą, NER | 1–3 d |
| S-05 | P1 | `app.js:65-67`, `policy.js` | Chmura włączona dla zarządu wysyła do chmury fragmenty dokumentów księgowości | harness: fragmenty `ksiegowosc/*` w żądaniu do API | przy trasie zewnętrznej filtrować fragmenty do działów z włączoną chmurą | 1 h |
| S-07 | P1 | `admin.mjs:15` | = F3 | | | |
| S-08 | P1 | `app.js:243`, `store.js` | Dziennik zapisuje pytanie po dziurawym maskowaniu; zarząd widzi treść pytań pracowników (monitorowanie pracowników, art. 22³ KP) | `/api/logs`: „jan kowalski z ulicy Długa 5/3…” | logować metadane (typy, liczba, trasa), treść tylko za dodatkowym uprawnieniem i z krótką retencją | 2 h |
| S-09 | P1 | `policy.js:59,62` | Fałszywe alarmy | **zweryfikowane osobiście**: „Diagnoza usterki agregatu chłodniczego” → `restricted`; „Numer zamówienia 12345678901” → `restricted PESEL` | suma kontrolna i data w regule głównej, zdrowie w kontekście osoby, pomiar na korpusie | 0,5 d |
| S-13 | P2 | `store.js` `takePending` | Wniosek utworzony przed przeniesieniem do innego działu można zatwierdzić po przeniesieniu; zapisuje się w starym dziale | test lokalny: 200 „Zapisano sprawę” | wymagać zgodności działu, czyścić wnioski przy zmianie działu | 30 min |
| S-14 | P1 (RODO) | `admin.mjs:39-69` | Prawa osób: dopasowanie podciągiem („Nowak” trafia „Nowakowska” i „Nowak Sp. z o.o.”), eksport pomija dziennik i zgłoszenia, usuwanie pomija pamięć odpowiedzi, kopie, dane u dostawców | test lokalny | wyszukiwanie po polach, podgląd rekordów, pełny eksport, procedura dla kopii i dostawców | 1 d |
| S-16 | P2 | `app.js:358` | Imię i nazwisko pracownika zawsze w prompcie do Claude'a (**zweryfikowane osobiście**); w połączeniu z pamięcią podręczną odpowiedź zwraca się do innej osoby | harness: „Dzień dobry Anna Lis!” u Ewy | usunąć nazwisko z promptu | 10 min |
| S-17 | P2 | `security.js` | Brak limitu bezczynności, unieważniania wszystkich sesji użytkownika, limitu sesji; flaga `Secure` zależna od proxy (NIEZWERYFIKOWANE na produkcji) | kod | | 2–3 h |
| S-10, S-11 | P2 | | = F17, F12 | | | |

**Sprawdzone bez zastrzeżeń:** izolacja wyszukiwania, IDOR (cudze wnioski, zrzuty, zgłoszenia → 403/404), 8 endpointów zarządu (403 dla innych, zakaz zmiany własnego działu, `__proto__` odrzucone), CSRF, XSS (escapowanie + CSP), path traversal w nazwach plików, walidacja zrzutów po sygnaturze, scrypt + porównanie w stałym czasie, brak sekretów w repozytorium (historia gita przeszukana pobieżnie), nagłówki HTTP produkcji (CSP, HSTS, XFO, nosniff, Permissions-Policy).

### 5.2. Ocena twierdzeń z prezentacji

| Twierdzenie | Werdykt | Dowód | Bezpieczne sformułowanie |
|---|---|---|---|
| „Nie da się tego obejść” (slajd 8) | **FAŁSZYWE** | S-03; prawdą jest tylko, że wybór modelu nie omija blokady | „Wybór modelu nie omija blokady. Filtr działa na regułach, więc celowe obejście jest możliwe — dlatego dochodzą zasady korzystania i docelowo model rozpoznający dane.” |
| „Nigdy nie wychodzą z firmy” (slajd 7) | **FAŁSZYWE** | S-01, S-02, S-05, S-16; do tego w demo „firma” to wynajęty serwer | „Pytania z rozpoznanymi danymi chronionymi nie są wysyłane do chmury.” |
| „Nie da się podszyć pod pracownika” (slajd 9) | **Częściowo w kodzie, fałszywe na demo** | S-06, S-10 | „Sesje chronione przed CSRF, XSS i kradzieżą ciasteczka. Demo ma jawne konta pokazowe; w produkcji SSO z MFA.” |
| „Bez fałszywych alarmów” (slajd 14) | **FAŁSZYWE** | S-09 | „Numery sklejane z kilku wiadomości są sprawdzane sumą kontrolną, co ogranicza fałszywe alarmy.” |
| „Przegląd bezpieczeństwa nie znalazł poważnych luk” (slajd 15) | **Wprowadza w błąd** | przegląd robiły agenty AI; ten audyt znalazł P0 | „Kod przeszedł przegląd bezpieczeństwa wykonany przez agentów AI. Przed produkcją: niezależny test penetracyjny i przegląd RODO.” |

### 5.3. RODO: pseudonimizacja, nie anonimizacja

- Etykiety `[OSOBA_1]` są odwracalne (mapa na serwerze, `unmask`), a kontekst często pozwala ustalić tożsamość. To **pseudonimizacja** (art. 4 pkt 5), dane nadal są osobowe, a wysłanie do Anthropic to przetwarzanie i transfer poza EOG.
- `docs/06` poprawnie mówi o pseudonimizacji przy dzienniku, ale zdania „Dostawca modelu AI otrzymuje wyłącznie tekst po maskowaniu” i „Dane szczególnych kategorii nie są przetwarzane przez model w chmurze” są nieprawdziwe (S-01, S-04).
- Rejestr pomija odbiorców: Resend (zgłoszenia), OpenAI (obsługiwany w kodzie), wyszukiwanie internetowe Anthropic, webhooki.
- PESEL (art. 87) i wynagrodzenia **nie** są danymi szczególnych kategorii z art. 9 — ochrona słuszna, kwalifikacja prawna błędna.
- „Pełna DPIA nie jest obowiązkowa” — wątpliwe: nowe technologie + monitorowanie pracowników (dziennik treści pytań) + możliwe dane o zdrowiu w dokumentach. Lepiej: „DPIA zalecana, decyzja IOD”.
- Podstawa art. 6 ust. 1 lit. f wymaga udokumentowanego testu równowagi (LIA) — brak.
- DPA z Anthropic, SCC/DPF, TIA, retencja i brak trenowania po stronie dostawcy: **NIEZWERYFIKOWANE** (to umowy, nie kod).
- **Opis RODO w prezentacji i docs sugeruje zgodność, której nie da się potwierdzić bez analiz organizacyjnych i umownych.** Proponowane zdanie: „Opis przedstawia środki techniczne wspierające zgodność z RODO. Ocena zgodności wymaga analizy umów z dostawcami (DPA, transfer poza EOG), DPIA i decyzji IOD klienta.”

---

## 6. Audyt AI, RAG i automatyzacji

| # | Obszar | Status | Najważniejsze |
|---|---|---|---|
| 1 | Wyszukiwanie | CZĘŚCIOWE | BM25 z prostym obcinaniem końcówek; działa „przegląd/przeglądu”, nie znajduje „rabacie”, „zniżka”, „upust”, „służbowy samochód”; fragment z samym tytułem zajmuje miejsce |
| 2 | Uprawnienia przed wyszukiwaniem | POTWIERDZONE | filtr przed rankingiem; brak trafień = brak wywołania modelu |
| 3 | Kontekst dla modelu | CZĘŚCIOWE | fragmenty i historia maskowane; nazwisko pracownika jawnie; dokumenty w prompcie systemowym; historia „asystenta” od przeglądarki |
| 4 | Maskowanie | CZĘŚCIOWE | luki S-04; błędne trafienia: REGON jako telefon, „Filip Morris”, „Adam Mickiewicz Street” jako osoba |
| 5 | Dane wrażliwe | CZĘŚCIOWE / NIEPRAWIDŁOWE dla dokumentów | S-01, S-03 |
| 6 | Odmaskowanie | CZĘŚCIOWE | wpisany dosłownie token `[OSOBA_1]` zamienia się w osobę z dokumentu; zmieniony zapis tokenu nie jest odmaskowywany; ta sama osoba w trzech przypadkach = trzy tokeny |
| 7 | Cytowanie | CZĘŚCIOWE | `grounding.js` usuwa numery spoza zakresu, ale „999 zł [1]” przy fragmencie bez tej kwoty przechodzi; bez cytowań pokazywane są wszystkie trafienia |
| 8 | Halucynacje | CZĘŚCIOWE | chroni: zakres dokumentów, brak modelu bez trafień, prompt, filtr numerów, lista narzędzi, zatwierdzanie; brak: sprawdzania liczb względem źródła, Citations API, structured outputs, obsługi `max_tokens`, ewaluacji na prawdziwym modelu |
| 9 | Haiku / mocny model | CZĘŚCIOWE | heurystyka regex + długość; **domyślnie Opus**, na produkcji ustawiony Sonnet (zweryfikowane osobiście) — kod i dokumentacja rozjechane |
| 10 | Ollama / Bielik | CZĘŚCIOWE / PLANOWANE | kod działa na atrapie, domyślny `llama3.1`, brak testu |
| 11 | Pamięć podręczna | CZĘŚCIOWE | bez przecieku między działami; przeciek personalizacji między osobami działu (A4); klucz pomija uprawnienia web/general |
| 12 | Limity kosztowe | CZĘŚCIOWE | rezerwacja 0,02 USD; test równoległy: budżet 0,05 → wydane 0,2647 USD (5,3×); domyślnie budżet = brak limitu |
| 13 | Wnioski | CZĘŚCIOWE | lista narzędzi i schemat działają; brak walidacji typów i dat; akcja „wstrzyknięta” dokumentem trafia do kolejki |
| 14 | n8n | PLANOWANE | niepodłączony; webhook bez uwierzytelnienia, dział podaje wywołujący, stary model |
| 15 | Awarie modelu | CZĘŚCIOWE | 502 z komunikatem; brak timeoutu, ponowienia, przełączenia; literówka „Model model w firmie nie odpowiada” |

**Czy model może…**
- dostać się do dokumentów innego działu? **Nie** (filtr po stronie serwera);
- zignorować ograniczenia / ulec prompt injection? **Tak** — każdy pracownik może wgrać dokument z instrukcją, trafia do promptu systemowego; skutki ogranicza bramka narzędzi i zatwierdzanie (zachowanie prawdziwego modelu NIEZWERYFIKOWANE);
- wykonać nieautoryzowaną akcję? **Sam nie**; może przygotować wniosek z dowolnymi argumentami w obrębie narzędzi działu;
- wygenerować nieprawdziwe cytowania? **Tak**, jeśli numer mieści się w zakresie;
- zapisać nieprawidłowe działanie? **Tak**, po kliknięciu „Zatwierdź” (brak walidacji dat i typów);
- spowodować niekontrolowane wydatki? **Ograniczone częściowo** (A2).

---

## 7. Weryfikacja kosztów

| Twierdzenie | Status | Uzasadnienie |
|---|---|---|
| Cennik Haiku 0,1/0,5, Sonnet 2/10, Opus 4/20 USD za 1 mln tokenów | POTWIERDZONE | zgodny z `.env.example` i aktualnym cennikiem; na produkcji ustawiony `PRICING_JSON` (zweryfikowane osobiście, bez wartości) |
| „Claude Haiku 0,0001 USD” za pytanie | CZĘŚCIOWE | policzone; realnie ok. 0,00015–0,0003 USD (sam prompt systemowy to ~500 tokenów; notatka slajdu 13 mówi o 0,0002) |
| „Claude Sonnet 0,004 USD” | POTWIERDZONE na produkcji | produkcja ma `ANTHROPIC_MODEL_STRONG=claude-sonnet-5-5`; **domyślny kod używa Opusa** (2× drożej) |
| „≈ 1 USD za 1000 pytań” | NIEPOTWIERDZONE (założenie) | zależy od proporcji: 100% Haiku ≈ 0,15–0,3 USD, 100% Sonnet ≈ 4 USD; ≈1 USD przy ~20% analiz; brak jednostki „miesięcznie” na slajdzie |
| „Koszt zmierzony w wersji demo” | NIEPOTWIERDZONE | brak surowych danych pomiaru w repozytorium |
| „Budżet 3 USD, po wyczerpaniu nie trafiają do chmury” | POTWIERDZONE (konfiguracja), CZĘŚCIOWE (działanie) | budżet ustawiony na produkcji; rezerwacja za mała, przy równoległych pytaniach budżet przekraczalny |
| „Prawdziwy koszt każdego pytania, nie szacunek” | CZĘŚCIOWE | tokeny z odpowiedzi API, cena z ręcznego cennika, wyszukiwanie stałą stawką |

---

## 8. Zgodność prezentacji z kodem (wszystkie 22 slajdy)

Statusy: POTW · CZĘŚ · NIEPOTW · PLAN · NIEPRAW · NIEZWER (zależy od konfiguracji produkcji; tam, gdzie sprawdziłem osobiście, podano wynik).

| Slajd | Zdanie | Status | Dowód / uwaga | Proponowana poprawka |
|---|---|---|---|---|
| 1 | „Działa na żywo, z prawdziwym modelem Claude” | POTW | produkcja: `AI_PROVIDER=anthropic` (osobiście) | – |
| 2 | „Sprzedaż nie zobaczy dokumentów księgowości, nawet przez AI” | POTW | filtr przed wyszukiwaniem, testy | – |
| 2 | „Jedno logowanie” | CZĘŚ | konta lokalne, nie SSO | „Jedno logowanie (w demo konta lokalne)” |
| 3 | „podaje nazwę dokumentu… mówi wprost, że nie wie” | POTW / CZĘŚ | bez trafień – stały komunikat; przy trafieniach tylko instrukcja w prompcie | – |
| 3 | „zamiast nazwiska „osoba 1”” | CZĘŚ | model dostaje `[OSOBA_1]`; maskowanie heurystyczne | „rozpoznane nazwiska zamienione na etykiety” |
| 4 | „Claude, bez nazwisk i telefonów” | CZĘŚ | S-04 | „Claude, nazwiska i telefony maskowane automatycznie” |
| 4 | „tylko AI na serwerze firmy” (księgowość, zarząd) | CZĘŚ | domyślnie; zarząd może włączyć chmurę; w demo fragmenty bez AI (slajd mówi to w stopce) | „domyślnie tylko AI na serwerze firmy” |
| 4 | „korzysta z nich cały jego dział, ale żaden inny” | CZĘŚ | zarząd też widzi | „…cały jego dział i zarząd” |
| 5 | „Szuka tylko w dokumentach działu” | CZĘŚ | także we wspólnych | „…działu i wspólnych” |
| 5 | „jeśli jest PESEL, nr konta albo dane o zdrowiu → nic nie wychodzi” | CZĘŚ | zdrowie tylko po słowach kluczowych | „…zatrzymane wykryte dane chronione” |
| 5 | „Każdy krok trafia do dziennika” | CZĘŚ | jeden wpis na pytanie | „Każde pytanie trafia do dziennika…” |
| 6 | „odpowiada wyłącznie na ich podstawie” | CZĘŚ | polecenie, nie wymuszenie; do modelu idzie też 6 wiadomości historii | „ma polecenie odpowiadać tylko na ich podstawie” |
| 6 | „Gdy wyszukiwarka nic nie znajdzie, pytanie nie trafia do modelu” | CZĘŚ | wyjątki: prośba o akcję, wiedza ogólna/internet | „…(chyba że to prośba o działanie)” |
| 6 | „Numer źródła, którego model nie dostał, zostaje usunięty” | POTW | `grounding.js`, test; treść przypisana do złego źródła nie jest wykrywana | dodać zastrzeżenie w notatce |
| 7 | „Chronione… Nigdy nie wychodzą z firmy” | **NIEPRAW** | S-01, S-02, S-03 | „Wykryte dane chronione nie trafiają do chmury” |
| 7 | „administrator dostaje powiadomienie” | **NIEPRAW na produkcji** | `ALERT_WEBHOOK_URL` nieustawiony (osobiście) | ustawić webhook albo „administrator może dostać powiadomienie” |
| 7 | (notatka) „nie da się obejść blokady, pisząc „a co dalej?”” | CZĘŚ | historia od przeglądarki, rola „asystent” pomijana | – |
| 8 | „Nie da się tego obejść” | **NIEPRAW** | S-03 | „Wybór modelu nie omija blokady” |
| 8 | „Wykrywa automatycznie PESEL, konto, dowód, zdrowie, wynagrodzenia” | CZĘŚ | zdrowie i płace po słowach kluczowych | „…oraz typowe sformułowania o zdrowiu i płacach” |
| 9 | „Wszystko zaszyfrowane, kopia co noc” | CZĘŚ | dane aplikacji tak (produkcja: klucz ustawiony, cron jest — osobiście); `knowledge/*.md` jawne, wnioski w RAM, kopie na tym samym serwerze | „Dane aplikacji zaszyfrowane, kopia co noc na serwerze” |
| 9 | „nie da się podszyć pod pracownika” | **NIEPRAW (demo)** | S-06 | „chroniona przed CSRF, XSS i kradzieżą sesji” |
| 9 | „konto blokuje się po 5 błędnych próbach” | CZĘŚ | per konto i IP, 15 min, w pamięci | „…z jednego adresu, na 15 minut” |
| 9 | „U klienta dostęp przez jego chmurę, bez stałego klucza” | PLAN | brak Bedrock/Vertex w kodzie | „(do wdrożenia)” |
| 10 | „Dziennik… bez danych osobowych” | CZĘŚ | login pracownika + pytanie po dziurawym maskowaniu | „pytania po maskowaniu” |
| 10 | „Sprawy i wnioski… do czasu usunięcia” | CZĘŚ | wnioski oczekujące giną przy restarcie | rozdzielić wiersze |
| 10 | „Dokumenty działów… zaszyfrowane” | CZĘŚ | tylko wgrane w aplikacji | „Dokumenty wgrane w aplikacji: zaszyfrowane” |
| 10 | „nie służy do trenowania modeli” | NIEZWER | warunek umowny Anthropic | „zgodnie z warunkami API Anthropic” |
| 10 | brak wiersza o zgłoszeniach | – | zgłoszenia z nazwiskiem i zrzutem, wysyłane e-mailem | dodać wiersz |
| 11 | „≈ 1 USD” | NIEPOTW | założenie proporcji | „≈ 1 USD miesięcznie przy 80% prostych pytań” |
| 11 | „Claude Haiku 0,0001 USD” | CZĘŚ | realnie 0,0002 | „ok. 0,0002 USD” |
| 11 | „Claude Sonnet 0,004 USD” | POTW (produkcja) | kod domyślnie Opus | ustawić domyślny Sonnet w kodzie |
| 11 | „Koszt jednego pytania zmierzony w wersji demo” | NIEPOTW | brak danych | „odczytany z dziennika demo” + zrzut |
| 12 | „W każdym z nich zasady działów… działają tak samo” | **NIEPRAW** | abonament omija Compax | „W wariantach z własną aplikacją…” |
| 12 | „AI w chmurze, którą firma już ma” | PLAN | brak w kodzie | „(do podłączenia)” |
| 12 | „Aplikacja już to potrafi” | CZĘŚ | trasowanie jest, gałąź Ollamy nieprzetestowana | „Aplikacja ma już do tego trasowanie” |
| 13 | „Zarząd widzi każde pytanie i każdy cent” | CZĘŚ | panel: 100 ostatnich; plik: 500 | „Zarząd widzi pytania i koszty” |
| 13 | „Prawdziwy koszt każdego pytania, nie szacunek” | CZĘŚ | tokeny z API, cena z cennika | „Koszt z faktycznej liczby tokenów i cennika” |
| 13 | „Zarząd zmienia dział, dostęp do chmury i internetu. Od razu.” | POTW | testy, przeglądarka | – |
| 13 | „Po wydaniu 3 USD… nie trafiają do chmury” | CZĘŚ | możliwe przekroczenie | „Limit 3 USD miesięcznie” |
| 14 | „51 testów” | POTW | `npm test`: 51/51; suma grup się zgadza (dwa testy przypisane do grup luźno) | – |
| 14 | „Bez fałszywych alarmów” | **NIEPRAW** | S-09 | usunąć albo „ograniczenie fałszywych alarmów” |
| 14 | „także rozbitych na kilka wiadomości” (karta, dowód, zdrowie) | CZĘŚ | testowany tylko PESEL | „PESEL także rozbity na kilka wiadomości” |
| 14 | „Internet: tylko dla osób z uprawnieniem” | CZĘŚ | bramka w kodzie, ale bez testu | dodać test |
| 15 | „Gotowe do oddania klientowi” | **NIEPRAW** | przeczy slajdowi 20 | „Gotowe do pilotażu” |
| 15 | „17 możliwych ataków, każdy z zabezpieczeniem i testem” | CZĘŚ | 14 z testem, 3 tylko konfiguracja | „…14 z testem automatycznym” |
| 15 | „Przegląd bezpieczeństwa nie znalazł poważnych luk” | **NIEPRAW** | przegląd agentów AI; ten audyt: P0 | patrz 5.2 |
| 15 | „Żądanie osoby z RODO obsłużone jednym poleceniem” | CZĘŚ | S-14 | „…obsługiwane narzędziem administratora” |
| 16 | lista dokumentów | POTW (istnienie) | `docs/01–08`, PDF | – |
| 17 | agenci, Superpowers, frontend-design, Claude Design | NIEPOTW | nie da się sprawdzić z repozytorium | – (to deklaracja autora) |
| 17 | „Playwright: zrzuty i testy w przeglądarce” | NIEPOTW | brak w `package.json` i `tests/` | „Playwright (skrypty poza repozytorium)” |
| 17 | „n8n: automatyzacja gotowa do włączenia” | CZĘŚ | osobny, niepodłączony workflow | „n8n: przykładowy workflow” |
| 18 | kolory, fonty, tryby, „ogranicz ruch” | POTW | CSS | – |
| 19 | harmonogram | PLAN | – | – |
| 20 | lista braków | POTW | uczciwa | – |
| 20 | (notatka) „wymiana jednego modułu” | CZĘŚ | API zapisu synchroniczne → zmiany w ~30 miejscach | „głównie wymiana warstwy zapisu” |
| 21 | „Czy da się bez API? … Zasady działów zostają te same” | **NIEPRAW** | abonament omija Compax | „Przy własnym serwerze zasady zostają; abonament to osobny produkt” |
| 22 | „Anna pyta o windykację → brak dostępu” | CZĘŚ | interfejs mówi „w dokumentach działu nie ma odpowiedzi” | „→ nie dostaje dokumentów księgowości” |
| 22 | loginy i hasła na slajdzie | **RYZYKO** | konto zarządu publiczne (S-06) | hasło zarządu przekazać osobno albo konto zarządu tylko do odczytu |

---

## 9. Korekta polszczyzny wszystkich 22 slajdów

Ocena: B = błąd językowy, S = niezręczność stylistyczna, N = niejasność merytoryczna, O = opcjonalne ulepszenie. Uwagi merytoryczne z sekcji 8 nie są tu powtarzane.

| Slajd | Oryginał | Poprawka | Uzasadnienie | Ocena |
|---|---|---|---|---|
| 1 Cover | „Zrobione tak, jak oddałbym to klientowi.” | „Przygotowane tak, jak oddałbym je klientowi.” | „zrobione” potoczne, „to” mgliste | O |
| 2 Pytanie | „swoje dokumenty, swoje zadania i swoje zasady” | „swoje dokumenty, narzędzia i zasady” | spójność z tytułem slajdu 4 („narzędzia”) | S |
| 2 (notatka) | „kilka linii konfiguracji” | „kilka wierszy konfiguracji” | kalka *line* | O |
| 3 Produkt | „Tak wygląda to u handlowca” | „Tak to wygląda u handlowca” | szyk enklityki „to” | S |
| 3 | „Wiadomo, skąd jest odpowiedź” | „Wiadomo, skąd pochodzi odpowiedź” | „być skądś” potoczne | S |
| 3 | „Asystent tylko przygotowuje spotkanie. Zostanie zapisane dopiero wtedy…” | „…Spotkanie zostanie zapisane dopiero wtedy…” | podmiot domyślny przejmuje się z podmiotu („asystent”) | **B** |
| 3 | „Po prawej widać…” | „W prawym panelu zrzutu widać…” | dwuznaczne (kolumna tekstu też jest po prawej) | N |
| 3/22 (zrzut UI) | „z kim: pan Janem Kowalskim” | „pan Jan Kowalski” | pomieszane przypadki (błąd w aplikacji) | **B** |
| 4 Działy | „Pracownik dodaje… i od razu korzysta z nich cały jego dział, ale żaden inny.” | „Gdy pracownik doda w aplikacji procedurę albo cennik, od razu korzysta z nich cały jego dział – i żaden inny.” | podmiot „korzysta” mylony z pracownikiem | S |
| 4 | „W demo nie ma jeszcze serwera AI w firmie” | „W demo nie ma jeszcze AI na serwerze firmy” | spójność z tabelą | S |
| 5 Sekwencja | „przycisk Zatwierdź” | „przycisk „Zatwierdź”” | cudzysłów jak na slajdach 3 i 6 | **B** (niekonsekwencja) |
| 5 | „sprawdza dane, ukrywa nazwiska” | „sprawdza dane, zamienia nazwiska i telefony na etykiety” | czwarty termin na maskowanie | S |
| 5 | „Każdy krok trafia… do jakiego modelu trafiło pytanie” | „Każde pytanie jest zapisywane w dzienniku…” | powtórzenie „trafia… trafiło” | S |
| 6 Halucynacje | „do czterech fragmentów” | „najwyżej cztery fragmenty” | „do” dwuznaczne; slajd 11 mówi „cztery” | N |
| 6 | „Jeśli fragmenty nie odpowiadają na pytanie” | „Jeśli fragmenty nie zawierają odpowiedzi” | personifikacja | S |
| 6 | „…a z internetu z linkami do stron.” | „…; informacje z internetu zawsze z linkami do stron.” | nieczytelna elipsa | S |
| 6 | „Proponuje tylko znane działania. Wykonanie zależy od człowieka i przycisku „Zatwierdź”.” | „Proponuje tylko z góry określone działania. O wykonaniu decyduje człowiek, klikając „Zatwierdź”.” | „znane” komu?; zeugma człowiek–przycisk | S |
| 6 | „polecenia systemowego” | „instrukcji dla modelu” | kalka *system prompt* | O |
| 7 Poziomy | „dowód” | „numer dowodu osobistego” | skrót myślowy (też slajdy 8, 14) | N |
| 7 | kropki na końcu opisów raz są, raz nie | ujednolicić | spójność interpunkcji w wyliczeniu | S |
| 8 Stop | „Nawet gdy… pytanie i tak zostanie zatrzymane.” | „…pytanie zostanie zatrzymane.” | „nawet… i tak” – nadmiar | S |
| 8 | „Gdy firma postawi własny serwer AI, takie pytania dostaną odpowiedź…” | „Gdy firma uruchomi własny serwer AI, odpowie on na takie pytania bez wysyłania danych na zewnątrz.” | „postawić” potoczne; personifikacja | S |
| 9 Bezpieczeństwo | „Zabezpieczone jak prawdziwy system firmowy” | „Zabezpieczenia jak w systemie produkcyjnym” | „prawdziwy” sugeruje, że reszta nie jest | O |
| 9 | „Hasła zabezpieczone (scrypt)” | „Hasła przechowywane jako skróty (scrypt)” | „zabezpieczone” nic nie mówi | N |
| 9 | „Serwer w UE: Hetzner…, dostęp do serwera tylko kluczem” | „…dostęp administracyjny tylko kluczem SSH” | powtórzenie „serwer” | S |
| 10 Dane | „Zapamiętane odpowiedzi… tylko pytania bez danych osobowych” (kolumna „Zabezpieczenie”) | „zapisywane tylko dla pytań bez danych osobowych; zaszyfrowane” | komórka nie odpowiada na nagłówek | N |
| 10 | „klucz poza kopią” | „klucz szyfrujący przechowywany osobno od kopii” | skrót myślowy | N |
| 10 | „klucz w sejfie chmury” (też 20) | „klucz w usłudze przechowywania kluczy (np. Azure Key Vault)” | kalka *cloud vault* | O |
| 11 Koszty | „≈ 1 USD” | „≈ 1 USD miesięcznie” | najważniejsza liczba bez jednostki czasu | N |
| 11 | „Płaci się za ilość tekstu wysłanego do AI.” | „…wysłanego do AI i od niego otrzymanego.” | uproszczenie | N |
| 11 | „AI na serwerze firmy … 0 USD” | „0 USD za pytanie” | przeczy podpisowi „płaci się za serwer” | N |
| 12 Warianty | „…dziennik działają tak samo. Zmienia się tylko to, gdzie działa model.” | „…dziennik pozostają takie same. Zmienia się tylko miejsce, w którym pracuje model.” | „działów… działają… działa” | S |
| 12 | kolumna „Kiedy to wybrać”: niejednorodne wiersze | „gdy trzeba szybko zacząć” / „gdy dane są wrażliwe” / „gdy działy mają mieć różne zasady” | paralelizm | S |
| 12 | „(Amazon, Google)” / „z Amazona albo Google” | „(AWS, Google Cloud)” | chodzi o usługi; niekonsekwentna odmiana | S |
| 12 | „Moja rekomendacja: połączenie.” | „Polecam połączenie obu rozwiązań.” | kalka | O |
| 13 Panel | „Prawdziwy koszt każdego pytania, nie szacunek.” | „…, a nie szacunkowy.” | „szacunek” czytany jako „respekt” | S |
| 13 | „Zarząd zmienia… dostęp do chmury i internetu. Od razu.” | „Zarząd zmienia dział pracownika oraz włącza i wyłącza dostęp do chmury i internetu ze skutkiem natychmiastowym.” | słaba kolokacja; „Od razu.” powtarza się na 3 slajdach | S |
| 13 (zrzut UI) | „1 pytań”, „0.0034”, „Logi” | „1 pytanie”, „0,0034”, „Dziennik” | odmiana, przecinek dziesiętny, termin (zrzut sprzed poprawek) | **B** (UI) |
| 14 Testy | „Dział widzi tylko swoje dokumenty, dziennik tylko zarząd.” | „…, a dziennik – tylko zarząd.” | elipsa wymaga myślnika | S |
| 14 | „Zatwierdza tylko autor i tylko raz” | „Wniosek zatwierdza tylko osoba, która go utworzyła, i tylko raz” | autor czego? | N |
| 14 | „Dane na dysku zaszyfrowane, dane osoby…” | „Dane na dysku są zaszyfrowane; informacje o osobie…” | powtórzenie | S |
| 14 | „e-” / „mail” na końcu wiersza | twarda spacja / niełamiący łącznik | typografia | B (typogr.) |
| 15 Gotowe | „procedura naruszenia” | „procedura postępowania w razie naruszenia ochrony danych” | skrót zmienia sens | **B** |
| 15 | „Żądanie osoby z RODO obsłużone jednym poleceniem.” | „Żądania osób, których dane dotyczą (np. usunięcie danych), obsługuje jedno polecenie.” | „osoba z RODO” – błędne przyłączenie | **B** |
| 15 | „Każda zmiana sprawdzana: Po każdej zmianie automatycznie: …” | „Po każdej zmianie automatycznie uruchamiają się testy, skan bibliotek i test aplikacji.” | dwa dwukropki, powtórzenie | S |
| 16 Dokumenty | „Zarząd, finanse” | „Zarząd, księgowość” | spójność z nazwą działu | S |
| 16 | „miary sukcesu” | „kryteria oceny efektów” | kalka *success metrics* | O |
| 17 Narzędzia | „Pentester i specjalista UX mobilnego” | „Agent-pentester i agent sprawdzający wygodę na telefonach” | brzmi jak ludzie; kalka *mobile UX* | N |
| 17 | Bielik w wierszu „Claude API” | osobny wiersz „Modele” | Bielik nie jest częścią Claude API | N |
| 17 (notatka) | „Pracę prowadzę skillami Superpowers” | „W pracy korzystam ze skilli Superpowers” | nienaturalna kolokacja | S |
| 18 Design | „Kompas podąża za kursorem, maskowanie na żywo, przebieg pytania przy przewijaniu.” | „Igła kompasu podąża za kursorem, maskowanie widać na żywo, a przebieg pytania odsłania się przy przewijaniu.” | mieszanie zdań i równoważników | S |
| 19 Wdrożenie | „Decyzja: Raport kosztów i efektów, decyduje zarząd.” | „Decyzja: raport kosztów i efektów dla zarządu.” | „decyzja… decyduje” | S |
| 19 | „Przed startem: logowanie kontem Microsoft…” | doprecyzować („przed pilotażem”) | logowanie jest już w etapie „Fundament” | N |
| 20 Brakuje | „Czego brakuje do produkcji” | „Czego brakuje do wdrożenia u klienta” | „produkcja” to żargon (klient prowadzi produkcję) | N |
| 20 | lead „zrobiłbym” vs kolumna „Co zrobię” | ujednolicić tryb | niespójność | S |
| 20 | „z drugim składnikiem” | „z weryfikacją dwuetapową” | kalka *second factor* | S |
| 20 | „Do obecnych reguł dochodzi model…” | „…dojdzie model…” | to plan – czas przyszły | **B** |
| 20 | „Efekty zmierzyłbym przed wdrożeniem i po nim” | „Wyniki pracy zmierzyłbym przed wdrożeniem i po nim” | efektów przed wdrożeniem jeszcze nie ma | S |
| 21 FAQ | „Czy role da się zmieniać?” | „Czy można zmieniać działy i uprawnienia?” | odpowiedź mówi o działach | S |
| 21 | „Działa od razu.” | „Zmiana działa od razu.” | brak podmiotu | S |
| 22 Demo | „Anna: „Jaki rabat mogę dać sam?”” | „…dać sama?” | zgodność rodzaju (forma pochodzi z podpowiedzi w aplikacji) | **B** |
| 22 | „Sprawdź sam w pięć minut” | „Do sprawdzenia w pięć minut” | „ty” i „sam” wobec właściciela firmy | S |
| 22 | „Anna pyta o windykację. brak dostępu” | „… – brak dostępu” | mała litera po kropce | **B** |
| 22 | loginy i hasła bez etykiet | dodać „login / hasło” | czytelność | N |

**Uwagi ogólne o języku:**
- Ujednolicić terminy: „AI na serwerze firmy” / „model w firmie” (UI); „demo” / „wersja pokazowa” / „tryb pokazowy”; „dziennik” / „Logi” (UI); „maskowanie” / „ukrywa” / „zamazane” (UI); „lub” / „albo”.
- Dodać twarde spacje po jednoliterowych spójnikach i przyimkach (w plikach nie ma ani jednego `&nbsp;`).
- Odmiana nazw obcych i terminów jest poprawna (Claude'a, z Claude'em, PESEL-u, w demo, na GitHubie, na iPhonie).
- Długość: **22 slajdy to za dużo na rozmowę** (30–40 min). Proponowana wersja główna (10 slajdów): Cover, Pytanie, Produkt, Sekwencja, Poziomy+Stop, Halucynacje, Koszty+Warianty, Bezpieczeństwo+Dane, Wdrożenie+Brakuje, Demo. Pozostałe jako aneks na pytania.

---

## 10. Ocena projektu jako zadania rekrutacyjnego

Perspektywa: właściciel małej agencji AI (Claude Code, agenci, n8n, klienci MŚP), szukający samodzielnej osoby technicznej.

1. **Rozumie problem biznesowy?** Tak w części „jedno AI, różne dane”: polityka per dział, koszty, zatwierdzanie przez człowieka, uczciwe warianty (także „kup abonament”). Słabiej w części „brak CRM i procesy”: odpowiedź to rejestr notatek, a nie proces.
2. **Dowodzi umiejętności programistycznych?** Tak: działający system, testy, CI, wdrożenie, sensowne zabezpieczenia webowe. Ale kod powstał z agentami AI w jeden dzień (78 commitów z jednej daty) — rekruter zapyta, co kandydat napisał lub zrozumiał sam.
3. **Rozumie architekturę czy tylko korzysta z agentów?** Kolejność bramy i kompromisy są przemyślane i dobrze opisane. Rozjazdy (Opus vs Sonnet w kodzie i dokumentacji, „wymiana jednego modułu” przy synchronicznym API, budżet z rezerwą 0,02 USD) sugerują, że nie wszystko zostało przeczytane krytycznie. Rozmowa to zweryfikuje.
4. **Wdroży samodzielnie u klienta?** Wdrożenie na VPS, HTTPS, CI, kopie — tak. Integracje produkcyjne (SSO, kalendarz, CRM, n8n w praktyce) — niepokazane.
5. **Rozsądnie ocenia ryzyko, czas, koszty?** Lista braków i plan etapów są dobre. Bezwzględne obietnice bezpieczeństwa — przeciwnie, to czerwona flaga dla klienta B2B.
6. **Prezentacja przekonująca?** Tak wizualnie i strukturalnie; za długa; kilka zdań obali jedno pytanie z sali.
7. **Co wzbudza zaufanie:** działające demo, slajd „Czego brakuje”, uczciwe notatki (halucynacje, wykrywanie regułowe), testy, kontrola kosztów, zatwierdzanie przez człowieka.
8. **Co wzbudza podejrzenia:** „nie da się obejść”, „nigdy”, „bez fałszywych alarmów”, „gotowe do oddania”, „przegląd nie znalazł poważnych luk”; hasło zarządu na slajdzie; dużo dodatków przy płytkim „zamiast CRM”.
9. **O co zapytałbym:**
   - „Wpiszę: «Kowalski choruje na cukrzycę». Co się stanie?” (oczekiwane: „przejdzie, bo filtr jest regułowy; dlatego NER i szkolenie, a dane szczególne nie powinny trafiać do czatu”).
   - „Gdzie jest proces? Co się dzieje po «Zatwierdź»?” (oczekiwane: „w demo notatka; u klienta wpis do kalendarza/arkusza przez n8n z kolejką i ponowieniami”).
   - „Restart serwera w trakcie pracy — co tracimy?” (oczekiwane: „sesje i wnioski oczekujące; poprawka: SQLite”).
   - „Jak policzyłeś 1 USD na 1000 pytań?” (oczekiwane: założenia proporcji, dane z dziennika).
   - „Co napisałeś sam, a co agent? Pokaż na kodzie, jak działa klasyfikacja.”
   - „Klient ma 15 osób. Polecisz mu Compax czy Claude Team?” (oczekiwane: uczciwe „raczej abonament + arkusz + n8n”).
10. **Długość:** przygotować wersję 10-slajdową na rozmowę, 22 slajdy zostawić jako materiał do wysłania.

---

## 11. Lista poprawek

### P0 — krytyczne

| # | Problem | Lokalizacja | Poprawka | Prac. | Weryfikacja |
|---|---|---|---|---|---|
| P0-1 | Dokumenty i historia „asystenta” bez klasyfikacji → dane chronione idą do chmury | `app.js:147,156` | `classify()` na fragmentach i całej historii; przy wykryciu: model lokalny albo blokada | 3–4 h | test: dokument z „zwolnienie lekarskie” → trasa ≠ chmura |
| P0-2 | Zgłoszenia z PESEL-em i zrzutem do Resend (USA) | `feedback.js` | e-mail bez treści i zrzutu („nowe zgłoszenie w panelu”); klasyfikacja; wpis w rejestrze | 2 h | test: brak treści w żądaniu do Resend |
| P0-3 | Publiczne hasło zarządu na demo i slajdzie | `public/app.html:67-71`, slajd 22 | konto zarządu tylko do odczytu w demo albo hasło przekazane osobno; reset danych co noc; komunikat „nie wpisuj prawdziwych danych” | 0,5 d | druga przeglądarka nie może zmieniać ustawień |
| P0-4 | Fałszywe bezwzględne twierdzenia w prezentacji | slajdy 7, 8, 9, 14, 15, 12/21 | sformułowania z sekcji 5.2 i 8 | 1 h | przegląd slajdów |

### P1 — ważne

| # | Problem | Lokalizacja | Poprawka | Prac. |
|---|---|---|---|---|
| P1-1 | Obejścia filtra (Unicode, słownie, historia od klienta, wielkość liter) | `policy.js`, `app.js` | normalizacja NFKC, usuwanie `\p{Cf}`, historia po stronie serwera, flaga `i`; opis ryzyka resztkowego | 1 d |
| P1-2 | Fałszywe alarmy (diagnoza usterki, 11 cyfr) | `policy.js:59,62` | suma kontrolna w regule głównej, zdrowie w kontekście osoby | 0,5 d |
| P1-3 | Luki maskowania | `pii.js` | adresy, telefony 2-2-2 i stacjonarne, słownik nazwisk; docelowo NER | 1–3 d |
| P1-4 | Zarząd z chmurą wysyła dokumenty księgowości | `app.js` | filtrować fragmenty do działów z chmurą | 1 h |
| P1-5 | Budżet przekraczalny | `app.js:48,204` | rezerwacja = max_tokens × cena; limit równoległych pytań | 2 h |
| P1-6 | Rotacja klucza psuje ustawienia | `admin.mjs:15` | wszystkie `*.json` | 1 h |
| P1-7 | Dziennik: 500 wpisów, treść pytań z PII | `store.js:58`, `app.js:243` | metadane zamiast treści; agregaty z `usage`; retencja czasowa | 0,5 d |
| P1-8 | Pamięć podręczna z personalizacją, nazwisko pracownika w prompcie | `app.js:358,179` | usunąć nazwisko z promptu; uprawnienia w kluczu | 1 h |
| P1-9 | Asystent nie czyta spraw; terminy „jutro” | `app.js:42`, prompt | indeksować sprawy, data w prompcie, ISO | 1 d |
| P1-10 | Limity per IP blokują biuro | `security.js` | per użytkownik / konto | 2–3 h |
| P1-11 | Brak timeoutów i ponowień | `providers.js` | `AbortSignal.timeout`, 1 ponowienie | 2 h |
| P1-12 | Domyślny „mocny” model to Opus, dokumentacja mówi Sonnet | `policy.js:122` | domyślnie Sonnet | 15 min |
| P1-13 | Szyfrowanie domyślnie wyłączone, brak fail-fast | `store.js`, `start-app.sh` | fail-fast w produkcji, generowanie klucza | 1 h |
| P1-14 | RODO: rejestr bez Resend/OpenAI/webhooków, błędna kwalifikacja art. 9, DPIA „nieobowiązkowa”, brak LIA | `docs/06` | poprawić dokument, dodać zastrzeżenie o zakresie | 2 h |
| P1-15 | Prawa osób: dopasowanie podciągiem, niepełny eksport | `admin.mjs` | wyszukiwanie po polach, pełny eksport | 1 d |
| P1-16 | Alert dla administratora nie jest skonfigurowany | `.env` produkcji | ustawić `ALERT_WEBHOOK_URL` albo zmienić slajd 7 | 15 min |
| P1-18 | PESEL rozbity z tekstem pomiędzy (B1) | `policy.js` | sklejanie ciągów cyfr + suma kontrolna | 2 h |
| P1-19 | Telefon klienta w temacie wniosku i w Sprawach (B2) | `tools.js:38` | temat bez danych kontaktowych | 30 min |
| P1-20 | „✓ undefined” po podwójnym zatwierdzeniu (B3) | `public/app.js` | blokada przycisku, obsługa błędu | 30 min |
| P1-17 | Kluczowe błędy językowe | slajdy 3, 15, 20, 22; podpowiedź „dać sam” i „pan Janem” w aplikacji | sekcja 9 (pozycje B) | 1 h |

### P2 — ulepszenia

- Wnioski i sesje trwałe (SQLite), zatwierdzanie transakcyjne, walidacja dat i typów w wnioskach, ponowna kontrola działu przy zatwierdzaniu (F8, F9, S-13, A10) — 1 d.
- Kopia poza serwerem i test odtworzenia (F14) — 0,5 d.
- Nadpisywanie cudzych dokumentów, limit dokumentów (F12) — 1 h.
- Historia kosztów (F13) — 15 min.
- Prompt injection: fragmenty jako niezaufane bloki w wiadomości użytkownika, akceptacja wgrań (A3) — 0,5 d.
- Sprawdzanie liczb w odpowiedzi względem cytowanego fragmentu, Citations API, structured outputs (A7, A13) — 0,5–1 d.
- Wyszukiwanie: polski stemmer lub embeddingi, pomijanie fragmentów z samym tytułem, zestaw 30–50 pytań z metryką recall@4 (A14) — 1–2 d.
- Ewaluacja na prawdziwym modelu (zestaw pytań z oczekiwanym źródłem) — 1 d.
- n8n: podłączyć z sekretem albo opisać jako przykład (A15) — 2–4 h.
- Konta poza kodem, reset hasła; docelowo OIDC (F16) — 0,5–1 d.
- ESLint, logi strukturalne, `/health`, monitoring (F19) — 0,5 d.
- `trust proxy` tylko na żądanie (F17) — 15 min.
- Literówka „Model model w firmie nie odpowiada” — 5 min.
- Błędy z przeglądarki B4–B11 i U1 (sekcja 3.2): „null” w dzienniku, narzędnik w nazwie klienta, litera O w PESEL-u, rola po przeniesieniu, nazwy w dzienniku, wylogowanie po odświeżeniu, układ na telefonie, przełącznik chmury bez klucza, podgląd dokumentów — łącznie ok. 1 d.
- Nowe zrzuty ekranu na slajdach 3, 13, 22 (stare napisy z UI) — 30 min.
- Twarde spacje i ujednolicenie terminów w prezentacji — 1 h.
- Wersja prezentacji na rozmowę (10 slajdów) — 1–2 h.

---

## 12. Rekomendowany plan dalszych działań

1. **Przed wysłaniem prezentacji / przed rozmową (około 3 h):** P0-4 (sformułowania), P1-17 (błędy językowe), P0-3 (hasło zarządu: przynajmniej konto tylko do odczytu albo hasło osobno), P1-16 (alert albo zmiana slajdu 7), P1-12 (domyślny Sonnet). Przygotować odpowiedzi na pytania z sekcji 10.
2. **Dzień 1 (bezpieczeństwo danych):** P0-1, P0-2, P1-4, P1-8, P1-6, P1-2 + testy dla każdego.
3. **Dzień 2 (wiarygodność i koszty):** P1-1, P1-5, P1-7, P1-11, P1-13; dokumentacja RODO (P1-14).
4. **Dzień 3 (rdzeń zadania):** P1-9 (sprawy w wyszukiwaniu, terminy ISO) i jedna realna integracja (np. zatwierdzone spotkanie → Google Calendar przez n8n z ponowieniami). To najlepiej odpowie na zarzut „gdzie jest proces”.
5. **Dalej (przed wdrożeniem komercyjnym):** SQLite, OIDC/SSO z MFA, NER dla polskiego, kopie poza serwerem z testem odtworzenia, monitoring, ewaluacja na prawdziwym modelu, niezależny pentest i przegląd RODO przez IOD klienta.

Każdą poprawkę wdrażać osobno, po zatwierdzeniu, z testem potwierdzającym (kolumny „weryfikacja”).

---

## Oceny

| Obszar | Ocena | Uzasadnienie |
|---|---|---|
| Jakość kodu | **6/10** | Małe moduły, czytelne nazwy, testy kluczowych ścieżek, staranne zabezpieczenia webowe. Minusy: bardzo gęste jednolinijkowce, reguły działów rozsiane (`"zarzad"` ×17), brak lintera i logów strukturalnych, błąd w rotacji klucza, rozjazdy kod–dokumentacja. |
| Architektura | **5/10** | Trafna idea bramy i kolejność kroków. Słaba warstwa trwałości: 10 plików JSON + pamięć procesu, liczniki z obciętego dziennika, jeden proces, brak timeoutów. |
| Bezpieczeństwo | **5/10** | Warstwa webowa solidna (CSP, CSRF, XSS, IDOR, scrypt, utwardzenie). Główna obietnica produktu — ochrona danych przed chmurą — ma potwierdzone luki P0 (dokumenty, zgłoszenia, obejścia filtra), a na demo konto zarządu jest publiczne. |
| Funkcjonalność | **6/10** | Szeroki, działający zakres: czat z dokumentów per dział, wnioski, panel zarządu z uprawnieniami, dokumenty, zgłoszenia, budżet. Wnioski niczego nie wykonują na zewnątrz, sprawy nie są używane przez AI, wnioski i sesje nietrwałe. |
| Praktyczne wykorzystanie AI | **6/10** | Dobra brama: zakres dokumentów, trasowanie chmura/lokalnie/blokada, brak modelu bez trafień, pamięć podręczna, dobór modelu, zatwierdzanie przez człowieka. Brak ewaluacji z prawdziwym modelem, kruche wyszukiwanie dla polszczyzny, cytaty sprawdzane tylko po numerze. |
| Logika biznesowa | **5/10** | Trafne: polityka danych per dział, kontrola kosztów, zatwierdzanie, uczciwe warianty. Nietrafione: „zamiast CRM” to rejestr notatek bez klienta i statusu; proces automatyzacji tylko pokazany; limity per IP nieprzystające do biura. |
| Polszczyzna | **8/10** | Ortografia i odmiana nazw obcych niemal wzorowe, rejestr w większości właściwy. Kilka prawdziwych błędów (podmiot domyślny na slajdzie 3, „osoba z RODO”, „procedura naruszenia”, „dać sam”, mała litera po kropce, „dochodzi”), skróty myślowe, niespójne terminy, brak twardych spacji. |
| Wiarygodność prezentacji | **6/10** | Opisuje działający system (nawet liczba 51 testów się zgadza), ma uczciwe notatki i listę braków. Obniżają: bezwzględne obietnice bezpieczeństwa obalane jednym zdaniem, „gotowe do oddania”, liczby kosztowe jako „zmierzone” bez danych, konfiguracja produkcji podana jako fakt (alert nieskonfigurowany). Po poprawkach P0-4 i P1-17: ok. 8–8,5. |
| Gotowość produkcyjna | **3/10** | Uczciwie opisana jako demo, ale: konta w kodzie, restart kasuje sesje i wnioski, brak klasyfikacji dokumentów i zgłoszeń, budżet przekraczalny, kopie i klucz na jednym serwerze bez testu odtworzenia, brak monitoringu i timeoutów, dziennik na kilkanaście godzin pracy firmy. |
| Ogólny poziom zadania rekrutacyjnego | **7/10** | Znacznie powyżej typowej odpowiedzi: działa na żywo, ma testy, CI, dokumentację, kontrolę kosztów i uczciwą listę braków. Odejmuję za płytkie „zamiast CRM / procesy” i za ryzyko utraty wiarygodności przez przesadzone twierdzenia. Po poprawkach P0 i kilku P1: 8. |

**Odpowiedź na najważniejsze pytanie:** Compax jest dobrze przemyślanym **demonstratorem z działającym rdzeniem bramy AI**, który po określonych poprawkach (P0 + kluczowe P1, około 3–5 dni) nadaje się na **pilotaż** u klienta, a po dalszych (SQLite, SSO, NER, kopie, monitoring, pentest, przegląd RODO) — do wdrożenia komercyjnego. Dziś **prezentacja obiecuje więcej, niż realizuje aplikacja**, ale różnica dotyczy głównie sformułowań i kilku konkretnych luk, a nie fikcyjnych funkcji.
