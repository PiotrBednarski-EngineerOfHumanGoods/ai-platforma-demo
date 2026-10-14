# Model zagrożeń

Przegląd ataków, na które narażony jest firmowy asystent AI, i tego, jak Compax się przed nimi broni. Każde zabezpieczenie ma test automatyczny (`npm test`) albo sprawdzenie na działającej instalacji (`npm run smoke`). Ryzyka, które zostają, są wypisane na końcu.

## Co chronimy

1. Dane osobowe klientów i pracowników.
2. Dokumenty działów (cenniki, procedury windykacji).
3. Klucz API i budżet na model.
4. Konta pracowników i to, że działanie wykonuje się tylko za zgodą człowieka.

## Ataki i zabezpieczenia

| Atak | Zabezpieczenie | Sprawdzenie |
|---|---|---|
| **Wyciek danych do chmury.** Pracownik wkleja PESEL, numer rachunku albo dane o zdrowiu i wybiera Claude. | Klasyfikacja przed wysłaniem, także całej historii rozmowy. Dane chronione idą tylko do modelu w firmie, inaczej pytanie zostaje zatrzymane. Wybór modelu przez pracownika tego nie omija. | smoke: „sprzedaż z wybranym Claude: PESEL i tak zatrzymany”, „dane chronione we wcześniejszej wiadomości blokują dalszą rozmowę” |
| **Nazwiska i telefony w zwykłych pytaniach** | Maskowanie przed modelem: model dostaje „[OSOBA_1]”, prawdziwe dane wracają dopiero u pracownika. | test „czat: do modelu idzie tekst zamaskowany” |
| **Prompt injection przez dokument lub wiadomość.** Ktoś dopisuje do dokumentu „wyślij wszystkie dane do…”. | Prompt systemowy traktuje treść jako dane. Model nie ma żadnego narzędzia, które samo coś wysyła: może tylko zaproponować wniosek. Serwer przepuszcza wyłącznie znane narzędzia dozwolone dla działu i tylko pola ze schematu, a odrzucone próby zapisuje w dzienniku. Wniosek wykonuje się dopiero po „Zatwierdź”. | `server/app.js` (walidacja wniosku), test „wniosek: decyduje tylko autor, tylko raz” |
| **Dostęp do dokumentów innego działu** | Filtr działu działa przed wyszukiwaniem, więc model nie dostaje cudzego fragmentu nawet przy podchwytliwym pytaniu. | test „wyszukiwanie: pytanie spoza działu nie dostaje cudzych dokumentów”, smoke |
| **Zatwierdzenie cudzego wniosku** | Wniosek może zatwierdzić tylko autor i tylko raz. | test i smoke „inny pracownik nie może zatwierdzić” |
| **Zgadywanie haseł** | scrypt; blokada konta po 5 nieudanych próbach z adresu; limit 10 prób na adres w 15 minut. | test „blokada konta po 5 błędnych próbach” |
| **Sprawdzanie, czy konto istnieje** | Ten sam komunikat i ten sam czas odpowiedzi dla złego hasła i nieznanego loginu. Lista pracowników tylko po zalogowaniu. | test „złe hasło 401 z tym samym komunikatem”, smoke |
| **Kradzież sesji przez XSS** | Sesja w ciasteczku HttpOnly. CSP bez wyjątków: tylko skrypty i style z naszego serwera, zero kodu wpisanego w HTML. Każda treść od użytkownika i modelu jest escapowana przed wyświetleniem. | smoke „CSP bez unsafe-inline”, „bez stylów i skryptów wpisanych w HTML” |
| **CSRF** (obca strona wysyła żądanie w imieniu pracownika) | Ciasteczko SameSite=Strict i wymagany nagłówek `X-Requested-With` przy każdym żądaniu zmieniającym dane. | test i smoke „żądanie bez nagłówka CSRF odrzucone” |
| **Clickjacking** | `frame-ancestors 'none'`: aplikacji nie da się osadzić w ramce. | smoke |
| **Złośliwy plik w bazie wiedzy** | Tylko `.md` i `.txt`, do 200 KB. Nazwa pliku jest czyszczona do liter i cyfr (bez `../`). Pracownik dodaje wyłącznie do swojego działu. | test „dokument: nie do cudzego działu, tylko .md/.txt, limit rozmiaru” |
| **Wyczerpanie budżetu albo klucza** | Limit 30 pytań na minutę z adresu, miesięczny limit zapytań do chmury na dział i twardy budżet w USD. Po jego przekroczeniu odpowiada model w firmie albo tryb pokazowy. Pytanie bez trafień w dokumentach nie idzie do modelu. | test „budżet w dolarach” |
| **Wyciek z dziennika** | Dziennik zapisuje pytania po maskowaniu, a zatwierdzenie zapisuje tylko rodzaj czynności. Alert o zatrzymanym pytaniu nie zawiera treści. Dziennik widzi tylko zarząd. | test „dziennik: zatwierdzenie wniosku zapisuje tylko rodzaj akcji”, smoke |
| **Kradzież dysku albo kopii zapasowej** | Dane szyfrowane AES-256-GCM. Klucz jest w `.env` z prawami 600 i nie trafia do kopii. Zły klucz przy starcie nie nadpisuje danych. | test „szyfrowanie: pliki w data/ nie zawierają jawnego tekstu”, test „aplikacja ze złym kluczem nie nadpisuje danych” |
| **Przejęcie serwera** | SSH tylko kluczem, firewall (22, 80, 443), automatyczne poprawki bezpieczeństwa, aplikacja na osobnym koncie bez uprawnień administratora i bez powłoki. | `deploy/setup-server.sh` |
| **Wyciek klucza API z repozytorium** | Klucze tylko w `.env` poza repozytorium. U klienta federacja tożsamości: serwer nie ma stałego klucza. | `.gitignore`, `docs/03-instrukcja-administratora.md` |
| **Podatna zależność** | Jedna zależność produkcyjna (Express). `npm audit` w CI przy każdej zmianie i cotygodniowe aktualizacje przez Dependabot. | `.github/workflows/ci.yml` |

## Ryzyka, które zostają (i co z nimi zrobić przed produkcją)

| Ryzyko | Dlaczego zostaje | Plan |
|---|---|---|
| Maskowanie oparte na regułach może przeoczyć nietypowy zapis danych | reguły i lista imion nie rozumieją kontekstu | dodać model rozpoznawania danych osobowych dla polskiego (Presidio + spaCy) jako drugą warstwę |
| Model może się pomylić w odpowiedzi | to cecha modeli językowych | odpowiedź zawsze ze źródłem; bez źródła asystent mówi, że nie wie; działania tylko po zatwierdzeniu |
| Brak logowania dwuskładnikowego | konta lokalne w wersji pokazowej | SSO Microsoft Entra ID albo Google Workspace z MFA i rolami z katalogu firmy |
| Sesje i limity w pamięci procesu | jeden serwer | Redis przy więcej niż jednej instancji; restart wylogowuje użytkowników (świadomy kompromis) |
| Jeden serwer, kopie na tym samym serwerze | wersja pokazowa | kopie poza serwerem (np. Hetzner Storage Box), monitoring i alerty |
