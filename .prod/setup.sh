#!/bin/sh
set -e
set -x

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

apt update
apt install -y webhook

source .env

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

SOCKET_FILE="/etc/systemd/system/webhook.socket"
cat <<EOF > "$SOCKET_FILE"
[Unit]
Description=Webhook server socket

[Socket]
ListenStream=9000

[Install]
WantedBy=multi-user.target
EOF

SERVICE_FILE="/etc/systemd/system/webhook.service"
cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Webhook server

[Service]
Type=exec
ExecStart=webhook -nopanic -hooks "${HOOKS_FILE}" -template
EOF

systemctl enable webhook.socket
systemctl start webhook.socket