# RODO: rejestr czynności przetwarzania i ocena ryzyka

Dokument dla inspektora ochrony danych (IOD) i prawnika klienta. Opisuje, jakie dane osobowe przetwarza Compax, gdzie i jak długo, oraz jakie środki chronią je zgodnie z art. 25 i 32 RODO. Uzupełnia [02-bezpieczenstwo-i-rodo.md](02-bezpieczenstwo-i-rodo.md).

Role: **administratorem** danych jest klient (Kriomar sp. z o.o.). **Podmiotem przetwarzającym** jest wykonawca wdrożenia, który utrzymuje system na podstawie umowy powierzenia (art. 28 RODO).

## Rejestr czynności przetwarzania (art. 30)

| Pole | Wpis |
|---|---|
| Nazwa czynności | Asystent AI dla pracowników: odpowiedzi z dokumentów firmy, przygotowywanie spotkań, notatek i przypomnień |
| Cel | Wsparcie pracy działów: szybsze odpowiedzi na podstawie procedur i cenników, przygotowanie czynności do zatwierdzenia przez pracownika |
| Podstawa prawna | art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes administratora: organizacja pracy); dla pracowników także art. 22¹ Kodeksu pracy w zakresie danych niezbędnych do pracy |
| Kategorie osób | pracownicy klienta (użytkownicy); osoby kontaktowe klientów i kontrahentów wymienione w pytaniach |
| Kategorie danych | użytkownicy: login, imię i nazwisko, dział, rola; osoby kontaktowe: imię i nazwisko, telefon, e-mail, NIP firmy, treść notatki |
| Dane szczególnych kategorii (art. 9) | **nie są przetwarzane przez model w chmurze**. Pytania z danymi o zdrowiu, PESEL-em, numerem rachunku, dokumentem tożsamości lub wynagrodzeniem osoby system zatrzymuje w firmie (test: „klasyfikacja: PESEL, konto, zdrowie są chronione”) |
| Odbiorcy | pracownicy działu, do którego należy sprawa; zarząd. Dostawca modelu AI otrzymuje wyłącznie tekst po maskowaniu |
| Podmioty podprzetwarzające | Hetzner Online GmbH (serwer, centrum danych w UE); Anthropic (API modelu Claude: tylko tekst po maskowaniu, dane nie są używane do trenowania modeli) |
| Przekazanie poza EOG | tylko do dostawcy modelu, tylko tekst po maskowaniu; na podstawie standardowych klauzul umownych z umowy powierzenia (DPA) dostawcy. Działy z danymi chronionymi (księgowość, zarząd) domyślnie nie korzystają z chmury |
| Okres przechowywania | dziennik: ostatnie 5000 wpisów, domyślnie bez treści pytań; pamięć odpowiedzi: 7 dni; sprawy: do usunięcia przez administratora; sesja: 8 godzin; kopie zapasowe: 14 dni; rozmowa: tylko w przeglądarce, do odświeżenia strony |
| Środki bezpieczeństwa | patrz niżej i [07-model-zagrozen.md](07-model-zagrozen.md) |

## Środki techniczne i organizacyjne (art. 32)

| Środek | Jak działa | Gdzie sprawdzić |
|---|---|---|
| Minimalizacja danych | Nazwiska, telefony, e-maile i NIP-y są zastępowane etykietami przed wysłaniem do modelu. Model widzi „[OSOBA_1]”, pracownik prawdziwe dane | `server/pii.js`, test „czat: do modelu idzie tekst zamaskowany” |
| Pseudonimizacja w dzienniku | Dziennik zapisuje pytanie po maskowaniu. Zatwierdzenie wniosku zapisuje tylko rodzaj czynności | test „dziennik: zatwierdzenie wniosku zapisuje tylko rodzaj akcji” |
| Blokada danych chronionych | PESEL, numer rachunku, dowód, zdrowie, wynagrodzenia osoby: tylko model w firmie, inaczej pytanie nie wychodzi, a administrator dostaje alert bez treści | `server/policy.js`, test „brama: dane chronione bez modelu lokalnego zostają w bramie” |
| Kontrola dostępu | Dział widzi tylko swoje dokumenty i wspólne; filtr działa przed wyszukiwaniem, więc model nie dostaje cudzych dokumentów | test „uprawnienia: dział widzi tylko swoje dokumenty” |
| Szyfrowanie danych w spoczynku | AES-256-GCM, klucz poza repozytorium i poza kopiami | `server/store.js`, test „szyfrowanie: pliki w data/ nie zawierają jawnego tekstu” |
| Szyfrowanie w transmisji | HTTPS (TLS) z certyfikatem Let's Encrypt, HSTS | `npm run smoke` |
| Uwierzytelnianie | hasła hashowane scryptem, blokada konta po 5 nieudanych próbach, sesja w ciasteczku HttpOnly i SameSite=Strict | testy „logowanie”, „blokada konta” |
| Człowiek decyduje | Każde działanie ze skutkiem na zewnątrz jest wnioskiem, który zatwierdza autor | test „wniosek: decyduje tylko autor, tylko raz” |
| Rozliczalność | Zarząd widzi dziennik: kto pytał, którą trasą poszło pytanie, jaki model, koszt | zakładka Dziennik |
| Ciągłość działania | Codzienna kopia zapasowa zaszyfrowanych danych, 14 dni wstecz | `deploy/backup.sh` |

## Ocena skutków (DPIA): kwalifikacja

Wstępna ocena według wytycznych EROD i listy Prezesa UODO:

| Kryterium | Czy występuje | Uzasadnienie |
|---|---|---|
| Nowe technologie (AI) | tak | model językowy |
| Dane na dużą skalę | nie | jedna firma, kilkudziesięciu użytkowników |
| Dane szczególnych kategorii | nie trafiają do modelu w chmurze | blokada w bramie |
| Monitorowanie pracowników | ograniczone | dziennik służy rozliczalności i kosztom, nie ocenie pracy; treść pytań po maskowaniu |
| Zautomatyzowane decyzje (art. 22) | nie | system tylko proponuje; decyzję podejmuje pracownik |

Wniosek: spełnione jest jedno kryterium z listy (nowe technologie), więc pełna DPIA nie jest obowiązkowa. Zalecamy jednak jej krótką wersję przed wdrożeniem we wszystkich działach, bo pracodawca wprowadza nowe narzędzie i powinien to udokumentować. Ostateczną decyzję podejmuje IOD klienta.

## Prawa osób (art. 15–22)

| Prawo | Jak realizujemy |
|---|---|
| dostęp, przenoszenie | `npm run admin -- szukaj "Nazwisko"` pokazuje, gdzie są dane osoby; `npm run admin -- eksport "Nazwisko" plik.json` przygotowuje kopię dla wnioskodawcy |
| sprostowanie | administrator poprawia sprawę; pracownik może dodać nową notatkę z poprawionymi danymi |
| usunięcie | `npm run admin -- usun "Nazwisko" --tak` usuwa sprawy i wpisy dziennika z tą frazą (bez `--tak` tylko podgląd); kopie zapasowe wygasają po 14 dniach |
| sprzeciw | pracownik może nie korzystać z asystenta; osoby kontaktowe: usunięcie notatek na żądanie |
| informacja (art. 13) | strona /prywatnosc w aplikacji; dla pracowników informacja w regulaminie korzystania z asystenta |

## Naruszenie ochrony danych

1. Kto wykryje incydent, zgłasza go administratorowi systemu i IOD klienta od razu.
2. Administrator odcina dostęp: zmienia `DATA_KEY` i klucze API, unieważnia sesje restartem procesu.
3. IOD ocenia ryzyko i w ciągu 72 godzin zgłasza naruszenie Prezesowi UODO, jeśli jest to wymagane (art. 33).
4. Wykonawca dostarcza dziennik zdarzeń i opis przyczyny w ciągu 24 godzin.

## AI Act

Compax jest systemem ogólnego zastosowania wewnątrz firmy, nie systemem wysokiego ryzyka z załącznika III: nie ocenia pracowników, nie decyduje o zatrudnieniu ani o kredycie. Obowiązki, które spełniamy: przejrzystość (użytkownik wie, że rozmawia z AI, i widzi, co trafiło do modelu) oraz kompetencje w zakresie AI (art. 4), czyli krótkie szkolenie przy wdrożeniu (plan w [05-plan-wdrozenia.md](05-plan-wdrozenia.md)).

## Uzupełnienia po audycie (docs/AUDYT-COMPAX.md)

- **Zakres tego dokumentu.** Opis przedstawia środki techniczne wspierające zgodność z RODO. Ocena zgodności wymaga analizy umów z dostawcami (umowa powierzenia, transfer poza EOG: SCC/DPF, ocena transferu), DPIA i decyzji inspektora ochrony danych klienta.
- **Pseudonimizacja, nie anonimizacja.** Etykiety typu „osoba 1” są odwracalne (mapa zostaje na serwerze), a kontekst może pozwolić ustalić tożsamość. Tekst wysyłany do dostawcy modelu nadal zawiera dane osobowe w rozumieniu art. 4 pkt 1.
- **Odbiorcy i podmioty przetwarzające.** Poza dostawcą modelu (Anthropic): Resend (powiadomienia o zgłoszeniach, USA; bez treści z danymi chronionymi i bez zrzutów ekranu), opcjonalnie OpenAI, wyszukiwanie w internecie u dostawcy modelu, webhooki alertów i zgłoszeń (Teams, Slack, n8n) – każdy wymaga wpisu w rejestrze i umowy.
- **Kwalifikacja danych.** PESEL (art. 87) i wynagrodzenia nie są danymi szczególnych kategorii z art. 9; system chroni je tak samo jak dane o zdrowiu, ale podstawa prawna jest inna.
- **DPIA.** Zalecana: nowe technologie, monitorowanie pracy (dziennik pytań, jeśli włączony `LOG_PROMPTS`), możliwe dane o zdrowiu w dokumentach. Decyzję podejmuje IOD klienta.
- **Prawnie uzasadniony interes (art. 6 ust. 1 lit. f)** wymaga udokumentowanego testu równowagi (LIA) przed wdrożeniem.
- **Ryzyko resztkowe.** Wykrywanie danych działa na regułach: typowe zapisy są łapane, celowe obejście (np. zapis słowny) jest możliwe. Uzupełnieniem są zasady korzystania, szkolenie i docelowo model rozpoznawania danych osobowych dla języka polskiego.

