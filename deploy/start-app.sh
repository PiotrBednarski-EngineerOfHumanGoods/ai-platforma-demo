#!/usr/bin/env bash
# Uruchomienie / aktualizacja aplikacji na serwerze. Uruchamiać jako root po wgraniu plików do /opt/ai-demo:
#   bash /opt/ai-demo/deploy/start-app.sh
set -euo pipefail
cd /opt/ai-demo

# .env tworzony tylko raz; klucz API (opcjonalnie) wpisz ręcznie: nano /opt/ai-demo/.env
if [ ! -f .env ]; then
  cat > .env <<ENV
AI_PROVIDER=mock
PORT=3000
HOST=127.0.0.1
# ANTHROPIC_API_KEY=sk-ant-...   # ustaw limit wydatków w konsoli Anthropic zanim włączysz
# MODEL=claude-sonnet-4-5
ENV
  chmod 600 .env
fi

npm ci --omit=dev
chown -R ai:ai /opt/ai-demo

# pm2 jako użytkownik "ai": restart po awarii i po reboocie serwera
sudo -u ai bash -c 'cd /opt/ai-demo && pm2 startOrReload deploy/ecosystem.config.cjs && pm2 save'
env PATH=$PATH:/usr/bin pm2 startup systemd -u ai --hp /home/ai | tail -1 | bash || true

sleep 2
curl -s -o /dev/null -w "Aplikacja lokalnie: HTTP %{http_code}\n" http://127.0.0.1:3000/
echo "Logi: sudo -u ai pm2 logs ai-demo"
