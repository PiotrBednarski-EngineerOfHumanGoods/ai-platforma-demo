# Bezpieczeństwo i RODO

Dokument dla działu IT, inspektora ochrony danych i prawnika klienta. Opisuje, jakie dane system przetwarza, gdzie je trzyma, kto ma do nich dostęp i co trafia do dostawców modeli.

## Przepływ jednego pytania

```
pracownik ──► logowanie (dział i rola)
pytanie ──► 1. wyszukiwanie tylko w dokumentach działu i wspólnych
            2. maskowanie danych osobowych w pytaniu, fragmentach dokumentów i historii rozmowy
            3. klasyfikacja: jawne / wewnętrzne / chronione
            4. pamięć odpowiedzi (pytania bez danych osobowych)
            5. trasa: model w firmie, chmura (po maskowaniu) albo zatrzymanie
            6. odpowiedź modelu, przywrócenie prawdziwych danych po stronie serwera
            7. walidacja zaproponowanej akcji (narzędzie dozwolone dla działu)
            8. wpis w dzienniku: bez treści z danymi osobowymi
„Zatwierdź” ──► wykonanie akcji, wpis w dzienniku
```

## Klasyfikacja danych

| Poziom | Przykłady | Dokąd może pójść |
|---|---|---|
| jawne | „jaki rabat mogę dać sam?” | model w firmie albo chmura, zależnie od polityki działu |
| wewnętrzne | imię i nazwisko, telefon, e-mail, NIP | model w firmie albo chmura, wyłącznie po maskowaniu |
| chronione | PESEL, numer rachunku bankowego (także w formacie IBAN z prefiksem PL), dowód osobisty, zdrowie, wynagrodzenia, hasła | wyłącznie model w firmie; bez niego pytanie zostaje na serwerze, administrator dostaje alert |

Klasyfikacja obejmuje całą rozmowę, nie tylko ostatnią wiadomość. Zatrzymane pytanie nie jest dołączane do dalszej rozmowy z modelem.

## Gdzie są dane

| Dane | Plik | Kto widzi | Retencja | Postać |
|---|---|---|---|---|
| zatwierdzone sprawy | `data/cases.json` | dział i zarząd | bez limitu | zaszyfrowane, z prawdziwymi danymi (to pamięć firmy) |
| dziennik pytań i decyzji | `data/logs.json` | zarząd | ostatnie 500 wpisów | zaszyfrowane, treść pytań tylko po maskowaniu |
| dokumenty dodane w aplikacji | `data/docs.json` | dział, do którego trafiły | do usunięcia | zaszyfrowane |
| pamięć odpowiedzi | `data/cache.json` | ten sam dział | 7 dni | zaszyfrowane, tylko pytania bez danych osobowych |
| liczniki kosztów | `data/usage.json` | zarząd | bieżący i poprzedni miesiąc | zaszyfrowane |
| rozmowa | przeglądarka pracownika | nikt inny | do odświeżenia strony | niezapisywana na serwerze |

Szyfrowanie: AES-256-GCM z losowym wektorem i znacznikiem integralności, klucz `DATA_KEY` w pliku `.env` na serwerze (prawa 600, tylko proces aplikacji). Kopie zapasowe zawierają pliki zaszyfrowane, a klucz jest przechowywany osobno.

## Dostawcy modeli

- Do chmury trafia wyłącznie tekst po maskowaniu. Prawdziwe wartości zostają na serwerze i są podstawiane do odpowiedzi.
- API Anthropic: dane przesyłane przez API nie są wykorzystywane do trenowania modeli. Jeśli klient tego wymaga, można uzgodnić zerową retencję danych (zero data retention) i zawrzeć umowę powierzenia przetwarzania (DPA).
- Model w firmie (Ollama, np. Bielik): dane nie opuszczają infrastruktury klienta. Wymagany dla danych chronionych.
- Politykę dla każdego działu ustala administrator (`DEPT_POLICY_JSON`), a zarząd może włączyć lub wyłączyć chmurę dla działu w panelu (zmiana w dzienniku). Domyślnie księgowość i zarząd bez chmury. Dane chronione nie wychodzą niezależnie od ustawienia.

## Dostęp i uwierzytelnienie

| Mechanizm | Stan |
|---|---|
| hasła | hash scrypt z solą, porównanie w stałym czasie, ten sam czas odpowiedzi dla istniejących i nieistniejących kont |
| sesja | losowy token w ciasteczku HttpOnly, Secure, SameSite=Strict, ważność 8 h, unieważniana przy wylogowaniu |
| ochrona przed zgadywaniem | blokada konta dla danego adresu IP po 5 nieudanych próbach, limit 10 prób na adres na 15 min |
| CSRF | ciasteczko SameSite=Strict i wymagany nagłówek na żądaniach zmieniających dane |
| przeglądarka | CSP bez wyjątków (`script-src 'self'`, `style-src 'self'`), brak zasobów z obcych serwerów, brak śledzących plików cookie, odpowiedzi API z `Cache-Control: no-store` |
| uprawnienia | sprawdzane na serwerze: dokumenty, sprawy, wnioski i dziennik według działu i roli |
| akcje od modelu | tylko znane narzędzia dozwolone dla działu, argumenty ze schematu, identyfikator nadaje serwer |
| serwer | HTTPS (Caddy, HSTS), firewall 22/80/443, aplikacja bez uprawnień administratora nasłuchuje tylko lokalnie, SSH wyłącznie kluczem, automatyczne aktualizacje bezpieczeństwa |

## Klucze do modeli

| Opcja | Kiedy |
|---|---|
| klucz API w `.env` (prawa 600), limit wydatków u dostawcy, osobny obszar roboczy (workspace) dla projektu | serwer bez dostawcy tożsamości (VPS) |
| federacja tożsamości (Workload Identity Federation): brak statycznego klucza, tokeny ważne kilka minut | wdrożenie w chmurze klienta (Azure, GCP, AWS) i w CI |

## Obowiązki po stronie klienta (RODO)

- Informacja dla pracowników o przetwarzaniu danych (art. 13 RODO), wpis w rejestrze czynności przetwarzania.
- Umowa powierzenia z dostawcą modelu w chmurze, jeśli jest używana.
- Regulamin korzystania z asystenta, w tym zasada: decyzje dotyczące ludzi podejmuje człowiek (wymaga tego również unijny AI Act).
- Ustalenie retencji dziennika i spraw; procedura usunięcia danych na żądanie (administrator usuwa wpisy w sprawach i dzienniku).

## Znane ograniczenia i prace przed wdrożeniem produkcyjnym

| Obszar | Teraz | W produkcji |
|---|---|---|
| maskowanie | reguły i lista imion (z odmianą) | dodatkowo model NER dla polskiego (Microsoft Presidio + spaCy pl) |
| logowanie | konta lokalne | SSO Microsoft Entra ID / Google Workspace, role z katalogu firmy |
| dane | pliki JSON zaszyfrowane, jeden serwer | PostgreSQL z szyfrowaniem, klucz w KMS, kopie poza serwerem |
| stan | sesje, limity i kolejka wniosków w pamięci procesu | Redis, kolejka trwała |
| monitoring | logi pm2 | alerty o błędach i kosztach, panel zdrowia |
