# Jak powstał Compax i pytania, które mogą paść

Ten dokument zbiera w jednym miejscu, jak projekt został zbudowany z pomocą AI, czym jest sprawdzony i co odpowiadam na pytania, które zwykle padają przy takim wdrożeniu.

## AI jako zespół

Jeden agent buduje, wyspecjalizowani agenci sprawdzają. Każdy dostaje wąskie zadanie i zwraca listę uwag z dowodami (plik i linia, zrzut ekranu albo żądanie i odpowiedź). Uwagi weryfikuję i wprowadzam, a każda poprawka błędu dostaje test.

| Agent | Zadanie | Co znalazł i co z tego wynikło |
|---|---|---|
| Claude Code | główny agent: kod, testy, wdrożenia na serwer, prezentacja | cała aplikacja, dokumentacja i infrastruktura |
| 3 agentów-recenzentów kodu | bezpieczeństwo, jakość kodu, UX przed wersją 1.0 | ponad 20 poprawek, każda z testem |
| 3 agentów-redaktorów | polszczyzna w prezentacji, aplikacji i dokumentach | ujednolicona terminologia (maskowanie, wniosek, dziennik), kalki z angielskiego usunięte |
| Specjalista UX mobilnego | iPhone SE, iPhone 14 i Pixel 7, tryb jasny i ciemny | 22 uwagi: m.in. przybliżanie ekranu przy logowaniu, ucięte menu modeli, dziennik jako karty na telefonie |
| Pentester | przegląd kodu pod kątem ataków | brak luk krytycznych i wysokich; poprawione: numery kart, numery rozbite na kilka wiadomości, nagłówki HSTS i Permissions-Policy, wyścig przy budżecie |
| Test dymny (własny skrypt) | wszystkie funkcje na działającym serwerze | wykrył, że dziennik zapisywał nazwisko przy zatwierdzaniu wniosku; poprawione i pokryte testem |

## Skille i narzędzia

| Narzędzie | Do czego |
|---|---|
| Skille Superpowers | sposób pracy: planowanie przed kodem, systematyczne szukanie przyczyn błędów, równoległe agenty do niezależnych zadań, sprawdzanie wyników przed oddaniem |
| Skill frontend-design | kierunek wizualny, typografia i projekt interfejsu strony startowej i aplikacji |
| Skill `claude-api` | integracja z API Claude: modele, ceny, dobór modelu do pytania |
| Własny skill `ai-security-checklist` | lista kontrolna przeglądu wdrożeń AI, w katalogu `skills/` |
| Claude Design | paleta, typografia i projekt ekranów |
| Artefakt Slides (Claude) | prezentacja dla klienta |
| Playwright | zrzuty ekranu do prezentacji, testy w przeglądarce, pomiar płynności animacji (klatki przy czterokrotnie spowolnionym procesorze) |
| Claude API: Haiku i Sonnet | odpowiedzi; tańszy model do prostych pytań, mocniejszy do analiz |

## Testy i jakość

- **64 testy automatyczne** (`npm test`): logowanie i sesje, blokada konta, CSRF, uprawnienia działów, wyszukiwanie tylko w dozwolonych dokumentach, maskowanie (także odmienione imiona), klasyfikacja danych chronionych (PESEL, rachunek, dowód, karta, zdrowie, wynagrodzenia, numery rozbite na kilka wiadomości), brama i limity, budżet, wnioski i ich zatwierdzanie, dziennik bez danych osobowych, dokumenty działów, szyfrowanie na dysku, narzędzie administratora, zgłoszenia ze zrzutem ekranu, zmiana działu pracownika i chmury działu z panelu zarządu, a po audycie także: co z dokumentów i historii nie może trafić do chmury, budżet przy równoległych pytaniach, sprawy w wiedzy działu, obejścia filtra i fałszywe alarmy.
- **Test dymny** (`npm run smoke`): ponad 40 kroków na działającym serwerze, także z prawdziwym modelem Claude, łącznie z nagłówkami bezpieczeństwa i CSP.
- **CI na GitHubie**: przy każdej zmianie testy, `npm audit` i test dymny na świeżo uruchomionej aplikacji. **Dependabot** co tydzień.
- **Wydajność**: animacje strony startowej mierzone klatka po klatce; 60 klatek na sekundę także przy czterokrotnie wolniejszym procesorze.

## Automatyzacje

- **Wdrożenie**: paczka z repozytorium przez SSH, restart procesu przez pm2, bez ręcznego kopiowania plików.
- **HTTPS**: Caddy, certyfikaty odnawiane automatycznie.
- **Kopie zapasowe**: co noc przez cron, 14 dni wstecz, zaszyfrowane.
- **System**: automatyczne poprawki bezpieczeństwa (unattended-upgrades), firewall.
- **Brama AI**: sama dobiera model do pytania, korzysta z pamięci podręcznej, pilnuje budżetu i limitów, a po ich przekroczeniu przechodzi na tryb bez chmury.
- **Alerty**: zatrzymane dane chronione wysyłają powiadomienie (webhook), bez treści pytania.
- **Zgłoś**: problem, pomysł albo pytanie od pracownika idzie od razu e-mailem (Resend) albo na webhook (Slack, Teams, n8n); zrzut ekranu zostaje w panelu zarządu, a treść z danymi chronionymi nie wychodzi w powiadomieniu.
- **RODO**: `npm run admin` wyszukuje, eksportuje i usuwa dane osoby oraz zmienia klucz szyfrowania z weryfikacją.
- **n8n**: plik workflow `n8n/asystent-firmowy.json` jest gotowy do importu. W demo go nie uruchamiałem.

## Pytania, które mogą paść

**Gdzie trzymasz klucze AI?**
W demo klucz jest w pliku `.env` na serwerze, poza repozytorium, z prawami tylko dla procesu aplikacji, a u dostawcy ustawiony jest limit wydatków. U klienta w jego chmurze użyłbym federacji tożsamości (Workload Identity Federation): serwer w ogóle nie ma stałego klucza, dostaje tokeny ważne kilka minut.

**Co, jeśli pracownik wklei PESEL albo numer konta?**
Brama wykrywa to przed wysłaniem, także gdy numer jest rozbity na kilka wiadomości, i zatrzymuje pytanie w firmie, nawet jeśli pracownik sam wybrał Claude. Administrator dostaje alert bez treści.

**Ile to kosztuje?**
Zmierzone w demo: ok. 1 USD na 1000 pytań w chmurze. Twardy limit budżetu wyłącza chmurę po jego przekroczeniu. Główny koszt wdrożenia to praca i utrzymanie, nie tokeny ([04-koszty.md](04-koszty.md)).

**Czy da się bez płacenia za API?**
Tak, cztery drogi z tą samą bramą: model w firmie (Ollama, np. Bielik), subskrypcja firmowa, chmura firmy w regionie UE albo API przez bramę. Rekomenduję hybrydę (README, sekcja „Nie tylko API”).

**Gdzie jest baza danych?**
W demo zaszyfrowane pliki na serwerze w Niemczech; przy kilku działach to wystarcza. W produkcji PostgreSQL z szyfrowaniem i kluczem w KMS. Warstwa zapisu jest w jednym module, więc to wymiana modułu, nie przepisanie aplikacji.

**Co z RODO?**
Rejestr czynności przetwarzania, środki z art. 32, kwalifikacja DPIA, procedura naruszenia i obsługa praw osób ([06-rodo-rejestr-i-ocena-ryzyka.md](06-rodo-rejestr-i-ocena-ryzyka.md)).

**Czy asystent może szukać w internecie albo odpowiadać ogólnie?**
Tak, ale tylko wybrane osoby, którym zarząd to włączy w panelu. Odpowiedź jest wtedy wyraźnie oznaczona jako „nie z procedur firmy”, z internetu przychodzi ze źródłami, a pytania z rozpoznanymi danymi chronionymi nie idą do wyszukiwarki. Domyślnie asystent odpowiada tylko z dokumentów firmy, żeby nie zmyślał.

**Czy to tylko demo?**
Demo pod względem danych (firma i konta są fikcyjne), ale kod, testy i dokumenty są w stanie do przekazania klientowi. Przed produkcją: logowanie firmowe (SSO z MFA), model rozpoznający dane osobowe po polsku jako druga warstwa, PostgreSQL, kopie poza serwerem, monitoring ([07-model-zagrozen.md](07-model-zagrozen.md)).

**Dlaczego Node.js bez frameworka frontendowego?**
Jedna zależność produkcyjna (Express), mała powierzchnia ataku, szybki audyt i strona, która ładuje się w ułamku sekundy. Przy większym zespole i rozbudowie przeszedłbym na framework.

### Jak radzisz sobie z halucynacjami?

Model nie dostaje okazji do zmyślania: odpowiada tylko na podstawie fragmentów dokumentów działu i podaje numer źródła. Gdy wyszukiwarka nic nie znajdzie, pytanie w ogóle nie trafia do modelu. Lista źródeł pochodzi z serwera, a numery, których model nie dostał, są usuwane. Wiedza ogólna i internet działają tylko za zgodą zarządu i są wyraźnie oznaczone. Model niczego nie wykonuje sam, bo każdą akcję zatwierdza człowiek. Brakuje jeszcze automatycznej oceny trafności na zestawie pytań; szczegóły w README, sekcja „Jak ograniczam halucynacje”.

## Czego jeszcze nie ma (uczciwie)

- Model w firmie (Ollama, Bielik) ma gotową integrację w bramie, ale nie jest podłączony.
- Workflow n8n jest przygotowany, ale w demo nieuruchomiony.
- E-mail ze zgłoszeń działa po dodaniu klucza Resend; bez niego zgłoszenia są zapisywane i widoczne dla zarządu.
- Logowanie to konta lokalne zamiast SSO.
- Wyszukiwanie w internecie działa przez narzędzie Claude i jest płatne osobno za wyszukanie; włącza je zarząd tylko wybranym osobom.

Pełna tabela z planem: README, sekcja „Czego brakuje do produkcji”.
