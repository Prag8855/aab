#!/bin/sh
set -e

. "${PROJECT_ROOT}/.env"

set -x

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v webhook >/dev/null 2>&1; then
  apt update
  apt install -y webhook
fi

mkdir -p /etc/webhook
mkdir -p /etc/systemd/system

HOOKS_FILE="/etc/webhook/hooks.yml"
cat <<EOF > "$HOOKS_FILE"
- id: deploy
  execute-command: ${PROJECT_ROOT}/.prod/deploy.sh
  command-working-directory: ${PROJECT_ROOT}
  trigger-rule:
    and:
      - match:
          type: payload-hash-sha256
          secret: ${GITHUB_WEBHOOK_SECRET}
          parameter:
            source: header
            name: X-Hub-Signature-256
      - match:
          type: value
          value: refs/heads/master
          parameter:
            source: payload
            name: ref
EOF

SERVICE_FILE="/etc/systemd/system/webhook.service"
cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Webhooks for CI
After=network.target

[Service]
Type=simple
ExecStart=webhook -port 9000 -hooks "$HOOKS_FILE" -template -verbose
Restart=on-failure
PrivateTmp=true
User=root
[Install]
WantedBy=default.target
EOF

systemctl enable webhook
systemctl restart webhook