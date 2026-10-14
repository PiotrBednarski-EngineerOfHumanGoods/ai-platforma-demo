# Bezpieczeństwo

## Zgłaszanie podatności

Jeśli znajdziesz lukę w Compax, nie zakładaj publicznego zgłoszenia (issue). Napisz przez prywatne zgłoszenie podatności na GitHubie (zakładka **Security → Report a vulnerability**) i opisz:

- czego dotyczy luka i jak ją odtworzyć,
- jaki może mieć wpływ (np. dostęp do danych innego działu),
- czy wiesz, że ktoś ją już wykorzystał.

Potwierdzamy zgłoszenie w ciągu 2 dni roboczych. Poprawkę krytyczną wdrażamy w ciągu 7 dni, a zgłaszającego informujemy o postępie. Prosimy nie testować na danych innych osób i nie obciążać instancji pokazowej.

## Wspierane wersje

| Wersja | Poprawki bezpieczeństwa |
|---|---|
| 1.x | tak |

## Jak jest zabezpieczony

Szczegóły dla IT i inspektora ochrony danych:

- [docs/07-model-zagrozen.md](docs/07-model-zagrozen.md): ataki, zabezpieczenia i testy, które je sprawdzają, oraz ryzyka, które zostają,
- [docs/02-bezpieczenstwo-i-rodo.md](docs/02-bezpieczenstwo-i-rodo.md): przepływ danych, gdzie co leży, szyfrowanie,
- [docs/06-rodo-rejestr-i-ocena-ryzyka.md](docs/06-rodo-rejestr-i-ocena-ryzyka.md): rejestr czynności przetwarzania, środki z art. 32, prawa osób, procedura naruszenia.

Sprawdzenie na własnej instalacji:

```bash
npm test                                # testy jednostkowe i integracyjne
BASE_URL=https://twoja-domena npm run smoke   # wszystkie funkcje i nagłówki na działającym serwerze
```
