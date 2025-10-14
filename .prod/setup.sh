#!/bin/sh
set -e
set -x

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

apt update
apt install -y webhook

. "${PROJECT_ROOT}/.env"

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
          type: payload-hmac-sha1
          secret: ${GITHUB_WEBHOOK_SECRET}
          parameter:
            source: header
            name: X-Hub-Signature
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
[Install]
WantedBy=default.target
EOF

systemctl enable webhook
systemctl restart webhook