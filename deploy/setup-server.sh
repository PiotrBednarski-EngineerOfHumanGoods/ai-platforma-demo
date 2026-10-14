#!/usr/bin/env bash
# Przygotowanie świeżego serwera Ubuntu 24.04 (Hetzner) pod demo. Uruchamiać jako root, JEDEN raz:
#   bash setup-server.sh demo.twojadomena.pl
# Instaluje: Node 22 LTS, pm2, Caddy (HTTPS automatycznie z Let's Encrypt), ufw (tylko 22/80/443).
set -euo pipefail
DOMAIN="${1:?Podaj domenę, np. demo.twojadomena.pl albo 1.2.3.4.sslip.io}"

apt-get update -y && apt-get upgrade -y
apt-get install -y curl ca-certificates gnupg ufw debian-keyring debian-archive-keyring apt-transport-https

# Node 22 LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2

# Caddy (oficjalne repo)
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update -y && apt-get install -y caddy

# Użytkownik bez hasła i bez shella dla aplikacji (minimalne uprawnienia)
id -u ai >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin ai
mkdir -p /opt/ai-demo && chown -R ai:ai /opt/ai-demo

# SSH tylko kluczem (bez haseł), root tylko kluczem; aktualizacje bezpieczeństwa automatycznie
sed -i -E 's/^#?PasswordAuthentication .*/PasswordAuthentication no/; s/^#?PermitRootLogin .*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart ssh
apt-get install -y unattended-upgrades && dpkg-reconfigure -f noninteractive unattended-upgrades

# Firewall: SSH, HTTP (tylko do przekierowania na HTTPS), HTTPS. Port 3000 NIE jest otwarty.
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# Caddy: HTTPS + reverse proxy na aplikację nasłuchującą tylko na 127.0.0.1:3000
cat > /etc/caddy/Caddyfile <<CADDY
${DOMAIN} {
  encode gzip
  header Strict-Transport-Security "max-age=31536000; includeSubDomains"
  reverse_proxy 127.0.0.1:3000
}
CADDY
systemctl enable caddy && systemctl restart caddy

echo
echo "Serwer gotowy. Teraz wgraj aplikację z laptopa (patrz deploy/README.md), potem: bash /opt/ai-demo/deploy/start-app.sh"
