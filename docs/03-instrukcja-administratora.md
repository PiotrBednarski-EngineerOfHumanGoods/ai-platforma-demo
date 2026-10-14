# Instrukcja administratora

Codzienna obsługa systemu na serwerze. Polecenia wykonuje się jako `root` po zalogowaniu kluczem SSH (`ssh root@ADRES`).

## Najważniejsze miejsca

| Co | Gdzie |
|---|---|
| aplikacja | `/opt/ai-demo` |
| konfiguracja i klucze | `/opt/ai-demo/.env` (prawa 600, właściciel `ai`) |
| dane (zaszyfrowane) | `/opt/ai-demo/data` |
| kopie zapasowe | `/var/backups/ai-demo`, codziennie o 3:15, 14 dni |
| logi aplikacji | `sudo -u ai pm2 logs ai-demo` |
| logi serwera WWW | `journalctl -u caddy` |

Po każdej zmianie w `.env`: `sudo -u ai pm2 restart ai-demo`.

## Konfiguracja (`.env`)

| Zmienna | Znaczenie |
|---|---|
| `AI_PROVIDER` | domyślny dostawca dla działów, które mogą z niego korzystać (`anthropic`, `openai`, `ollama`, `mock`) |
| `ANTHROPIC_API_KEY` | klucz API; najpierw ustaw limit wydatków w konsoli Anthropic |
| `ANTHROPIC_MODEL_CHEAP` / `ANTHROPIC_MODEL_STRONG` | model do prostych pytań i do analiz |
| `OLLAMA_URL`, `OLLAMA_MODEL` | model w firmie; po ustawieniu dane chronione idą do niego |
| `DEPT_POLICY_JSON` | dozwoleni dostawcy na dział, np. `{"ksiegowosc":["mock","ollama"]}` |
| `APP_MONTHLY_BUDGET_USD` | miesięczny budżet na chmurę dla całej firmy |
| `CLOUD_MONTHLY_LIMIT` | miesięczny limit pytań do chmury na dział |
| `PRICING_JSON` | ceny modeli za milion tokenów, do licznika kosztów |
| `ALERT_WEBHOOK_URL` | adres powiadomień (Teams, Slack, n8n) o zatrzymanych pytaniach |
| `DATA_KEY` | klucz szyfrowania danych (64 znaki hex). **Zapisz go w menedżerze haseł.** Bez niego dane i kopie są nie do odczytania |

Edycja: `nano /opt/ai-demo/.env`. Nigdy nie wpisuj kluczy w poleceniu (`echo ... >> .env`), bo zostają w historii poleceń.

## Użytkownicy

Konta są w `server/users.js`: login, imię i nazwisko, dział, rola, hash hasła. Nowe hasło:

```bash
cd /opt/ai-demo && node -e "import('./server/security.js').then(m => console.log(m.hashPassword('NoweHaslo')))"
```

Wynik wklej w pole `passwordHash` konta, zapisz, zrestartuj. W wersji produkcyjnej konta pochodzą z logowania firmowego (Entra ID / Google), a ten plik znika.

## Dokumenty

- Dokumenty stałe, dla wszystkich lub działu: pliki `.md` w `knowledge/<dział>/`, sekcje zaczynające się od `## `. Po zmianie restart aplikacji.
- Dokumenty dodawane przez pracowników: w aplikacji, zakładka „Moja baza wiedzy”, przycisk „Dodaj dokument”. Są zaszyfrowane w `data/docs.json`, działają od razu.

## Kopie zapasowe i odtworzenie

Kopia: automatycznie co noc. Ręcznie: `bash /opt/ai-demo/deploy/backup.sh`.

Odtworzenie wybranego dnia:

```bash
sudo -u ai pm2 stop ai-demo
tar -xzf /var/backups/ai-demo/data-RRRR-MM-DD.tar.gz -C /opt/ai-demo
chown -R ai:ai /opt/ai-demo/data
sudo -u ai pm2 start ai-demo
```

Odtworzenie wymaga tego samego `DATA_KEY`, z którym kopia powstała. Kopie warto dodatkowo wysyłać poza serwer (Hetzner Backup, S3 z wersjonowaniem).

## Rotacja kluczy

- **Klucz API:** utwórz nowy w konsoli dostawcy, podmień w `.env`, restart, usuń stary w konsoli.
- **`DATA_KEY`:** zatrzymaj aplikację (`pm2 stop ai-demo`), wykonaj kopię (`deploy/backup.sh`), uruchom `NEW_DATA_KEY=$(openssl rand -hex 32) npm run admin -- nowy-klucz` (najpierw odczytuje wszystko starym kluczem, po zapisie sprawdza odczyt nowym), wpisz nowy klucz do `.env` jako `DATA_KEY` i uruchom aplikację.
- **Wnioski osób (RODO):** `npm run admin -- szukaj | eksport | usun "fraza"`, przy zatrzymanej aplikacji. Szczegóły w [06-rodo-rejestr-i-ocena-ryzyka.md](06-rodo-rejestr-i-ocena-ryzyka.md).
- **Zły klucz przy starcie:** aplikacja nie nadpisze danych. Nieczytelny plik zostaje odłożony jako `data/<nazwa>.json.nieczytelny-<czas>`; po ustawieniu właściwego klucza przywróć go pod pierwotną nazwą.

## Aktualizacja aplikacji

Z komputera z repozytorium:

```bash
git archive --format=tar.gz HEAD | ssh root@ADRES "tar -xzf - -C /opt/ai-demo && chown -R ai:ai /opt/ai-demo && sudo -u ai pm2 restart ai-demo"
```

Wysyłane są tylko pliki z gita, więc `.env` i dane na serwerze zostają nietknięte. Przed aktualizacją: `npm test`.

## Gdy coś nie działa

| Objaw | Sprawdź |
|---|---|
| strona nie odpowiada | `sudo -u ai pm2 status`, `journalctl -u caddy -n 50` |
| „Model nie odpowiada” | klucz w `.env`, środki i limit w konsoli dostawcy, `pm2 logs` (wpis `model error`) |
| pytania trafiają do trybu pokazowego zamiast do chmury | budżet `APP_MONTHLY_BUDGET_USD` wyczerpany (panel zarządu) albo dział bez chmury w polityce |
| komunikat o nieczytelnym pliku w logu przy starcie | zły lub brakujący `DATA_KEY`; przywróć właściwy klucz, nie usuwaj danych |
