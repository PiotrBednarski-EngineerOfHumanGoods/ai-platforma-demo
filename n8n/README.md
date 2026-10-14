# Wariant n8n: ten sam przepływ jako workflow

Plik `asystent-firmowy.json` to ten sam fundament co w aplikacji, ułożony w n8n:

```
Webhook (POST /webhook/asystent)
  → Code: rola i uprawnienia + maskowanie danych osobowych
  → AI Agent (model podpięty jako osobny węzeł: Anthropic / OpenAI / Ollama – zmiana w jednym miejscu)
  → Code: odmaskowanie odpowiedzi + wpis do logu
  → Google Sheets (log: co poszło do modelu, ile PII)  +  Telegram (powiadomienie)  +  odpowiedź do pracownika
```

## Uruchomienie lokalnie (10 minut)

```bash
npx n8n            # otwórz http://localhost:5678, załóż konto lokalne
```

1. Workflows → Import from file → `asystent-firmowy.json`.
2. Kliknij węzeł **Model: Anthropic Chat** → dodaj Credential z kluczem API (klucz trafia do sejfu n8n, nie do workflow).
   Bez klucza: podmień węzeł modelu na **Ollama Chat Model** (lokalny) albo OpenAI.
3. Węzły Google Sheets i Telegram są opcjonalne – jeśli nie masz podłączonych kont, kliknij prawym → *Deactivate*.
4. Kliknij **Test workflow**, a potem wyślij zapytanie:

```bash
curl -X POST http://localhost:5678/webhook-test/asystent \
  -H "content-type: application/json" \
  -d '{"user":"anna","dept":"sprzedaz","message":"Umów spotkanie z panem Janem Kowalskim, tel. 600 123 456, we wtorek o 10:00"}'
```

W odpowiedzi dostaniesz `answer` i `pii_found: 2`. W węźle *Code: rola + maskowanie PII* zobaczysz, że do modelu poszło `[OSOBA_1]` i `[TELEFON_1]`.

## Co to pokazuje

- **Webhook** – adres, na który inny system (Teams, formularz, CRM) sam wysyła zdarzenie; workflow nie odpytuje nikogo w pętli.
- **Brama AI w n8n** – model jest osobnym węzłem podpiętym do agenta; zmiana dostawcy to podmiana jednego węzła.
- **Sekrety** – klucze w *Credentials* n8n, nie w eksportowanym JSON (ten plik nie zawiera żadnych kluczy).
- **Maskowanie PII i log** – to samo, co w aplikacji, w dwóch węzłach Code.

## Kiedy n8n, a kiedy kod

n8n: integracje, przypomnienia, obieg dokumentów, szybki pilot. Kod: uprawnienia per dokument, baza wiedzy z embeddingami, testy, audyt. W praktyce oba razem – n8n orkiestruje, mały serwis w kodzie pilnuje bezpieczeństwa (patrz rozdział 9 dokumentu).
