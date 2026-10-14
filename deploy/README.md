# Wdrożenie dema na Hetzner Cloud (HTTPS, ok. 4 € / mies.)

Architektura na serwerze: **Caddy** (port 443, certyfikat Let's Encrypt automatycznie) → **aplikacja Node** nasłuchująca tylko na `127.0.0.1:3000`, uruchomiona przez **pm2** jako użytkownik systemowy `ai` bez shella. Firewall `ufw` przepuszcza wyłącznie 22, 80 i 443. Port 3000 nie jest widoczny z internetu.

## 0. Klucz SSH na laptopie (raz)

W Git Bash:

```bash
ssh-keygen -t ed25519 -C "hetzner" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Skopiuj wypisaną linię (zaczyna się od `ssh-ed25519`).

## 1. Serwer w konsoli Hetzner

console.hetzner.cloud → projekt → **Servers → Add Server**:

| Pole | Wybór | Dlaczego |
|---|---|---|
| Location | **Falkenstein** lub **Nuremberg** | serwer w UE (RODO) |
| Image | **Ubuntu 24.04** | skrypt jest pod tę wersję |
| Type | Shared vCPU x86, najmniejszy **CX** (2 vCPU, 4 GB) | wystarcza z zapasem |
| SSH key | **Add SSH key** → wklej klucz z kroku 0 | logowanie bez hasła |
| Firewall | opcjonalnie: reguły 22, 80, 443 in | ufw i tak to robi na serwerze |
| Name | `ai-demo` | |

Po utworzeniu zapisz **IP serwera**.

## 2. Adres (domena)

Masz domenę → dodaj rekord **A** `demo.twojadomena.pl → IP serwera` i poczekaj kilka minut.
Nie masz → użyj darmowej nazwy `IP-z-myślnikami.sslip.io`, np. dla 203.0.113.10: `203-0-113-10.sslip.io`. Działa od razu, bez konfiguracji. (Let's Encrypt limituje certyfikaty na całą domenę sslip.io, więc przy pechu certyfikat przyjdzie z zapasowego ZeroSSL, Caddy robi to sam.)

## 3. Wgranie aplikacji z laptopa

W Git Bash, w folderze `ai-platforma-demo`. Wysyłane są tylko pliki zatwierdzone w gicie, więc lokalny `.env` ani dane nie trafią na serwer:

```bash
git archive --format=tar.gz HEAD | ssh root@IP "mkdir -p /opt/ai-demo && tar -xzf - -C /opt/ai-demo"
```

## 4. Przygotowanie serwera (raz) i start

```bash
ssh root@IP "bash /opt/ai-demo/deploy/setup-server.sh DOMENA"
ssh root@IP "bash /opt/ai-demo/deploy/start-app.sh"
```

Po minucie: `https://DOMENA` pokazuje ekran logowania. Pierwsze wejście może potrwać kilka sekund (Caddy pobiera certyfikat).

## 5. Aktualizacja po zmianach w kodzie

Powtórz krok 3, potem `ssh root@IP "bash /opt/ai-demo/deploy/start-app.sh"` (pm2 przeładuje proces bez przerwy).

## 6. Prawdziwy model zamiast mocka (opcjonalnie)

1. W konsoli Anthropic ustaw **limit wydatków** (np. 10 USD / mies.).
2. `ssh root@IP nano /opt/ai-demo/.env` → ustaw `AI_PROVIDER=anthropic` i `ANTHROPIC_API_KEY=...`.
3. `ssh root@IP "sudo -u ai pm2 restart ai-demo"`.

Klucz leży tylko w `.env` z prawami `600` na serwerze. Nie trafia do kodu ani do repozytorium.

## Co jest zabezpieczone, a co nadal jest demem

| Zabezpieczone | Nadal uproszczenie demo |
|---|---|
| HTTPS z HSTS (Caddy), aplikacja niewidoczna poza Caddy | hasła z hashem scrypt, lista kont w kodzie (produkcja: SSO Microsoft/Google) |
| SSH tylko kluczem, root bez hasła, automatyczne aktualizacje bezpieczeństwa | dane spraw i logi w plikach JSON (produkcja: Postgres z szyfrowaniem) |
| firewall: tylko 22, 80, 443; proces bez roota, bez shella | brak kopii zapasowych |
| losowe tokeny sesji, wygasają po 8 h, wylogowanie unieważnia token | brak retencji czasowej logów |
| limit 10 prób hasła / 15 min / IP; limit 30 pytań / min / IP | limity w pamięci procesu (produkcja: Redis) |
| walidacja wejścia: typ i długość wiadomości oraz historii | maskowanie regułami (produkcja: Presidio + NER) |
| nagłówki: CSP, nosniff, no-frame, no-referrer; treść użytkownika escapowana w UI | jeden serwer, bez monitoringu i alertów |
| PII maskowane w pytaniu, fragmentach i historii; klucz API tylko w .env (600) | |

Przydatne: `ssh root@IP "sudo -u ai pm2 logs ai-demo --lines 50"` (logi aplikacji), `ssh root@IP "journalctl -u caddy -n 50"` (logi Caddy).
