#!/bin/sh
set -e
set -x

python3 manage.py makemigrations
python3 manage.py migrate --noinput

# Capture cron logs
rm -f /tmp/stdout /tmp/stderr
mkfifo /tmp/stdout /tmp/stderr
chmod 0666 /tmp/stdout /tmp/stderr
tail -f /tmp/stdout &
tail -f /tmp/stderr >&2 &

# Start cron and pass environment variables to it
printenv > /etc/environment
crontab /srv/crontab.conf
service cron start

gunicorn --reload --config /srv/gunicorn_config.py api.wsgi:application