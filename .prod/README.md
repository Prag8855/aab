# Deployment to production

Deployments are triggered by a GitHub webhook. It requires `webhook` to be installed and running. The webhook runs at `http://allaboutberlin.com:9000/hooks/deploy`.

`webhook` runs as a systemd socket and service. To see the `webhook` logs, run `journalctl -u webhook.service` and `journalctl -u webhook.socket`.

## Setup

1. Clone this repository
2. Create a `.env` file in your project root. Use `.env.example` as a template.
3. Run `setup.sh`.

## Remote database backups

Add `REMOTE_DB_BACKUPS_PATH` to your `.env` file to enable remote database backups. Make sure that the host machine can connect to that remote server. Use `ssh-copy-id` to enable password-less login, and make sure the remote machine is in the production server's `.ssh/known_hosts`. This is not handled by ``.prod/setup.sh`.