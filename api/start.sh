#!/bin/sh
set -e
set -x

if [ "${DEBUG:-0}" -eq 1 ]; then
    # Do not generate migrations in production
    python3 manage.py makemigrations
fi
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

# Disable live reload if DEBUG is false
if [ "${DEBUG:-0}" -eq 1 ]; then
    gunicorn --reload --config /srv/gunicorn_config.py api.wsgi:application
else
    gunicorn --config /srv/gunicorn_config.py api.wsgi:application
fi