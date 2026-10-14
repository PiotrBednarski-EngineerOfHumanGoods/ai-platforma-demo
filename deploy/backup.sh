#!/usr/bin/env bash
# Codzienna kopia danych aplikacji (pliki są już zaszyfrowane AES-256-GCM, jeśli ustawiono DATA_KEY).
# Instalacja (raz, jako root): bash /opt/ai-demo/deploy/backup.sh --install
# Kopie: /var/backups/ai-demo/data-RRRR-MM-DD.tar.gz, przechowywane 14 dni.
# Klucz DATA_KEY NIE jest w kopii: trzymaj go osobno (menedżer haseł). Bez klucza kopia jest bezużyteczna, i o to chodzi.
set -euo pipefail
DEST=/var/backups/ai-demo
if [ "${1:-}" = "--install" ]; then
  mkdir -p "$DEST" && chmod 700 "$DEST"
  echo "15 3 * * * root bash /opt/ai-demo/deploy/backup.sh >/dev/null 2>&1" > /etc/cron.d/ai-demo-backup
  chmod 644 /etc/cron.d/ai-demo-backup
  echo "Zainstalowano: codziennie o 3:15, katalog $DEST"
  exit 0
fi
mkdir -p "$DEST"
tar -czf "$DEST/data-$(date +%F).tar.gz" -C /opt/ai-demo data
chmod 600 "$DEST"/data-*.tar.gz
find "$DEST" -name 'data-*.tar.gz' -mtime +14 -delete
