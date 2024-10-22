#!/bin/sh
set -e
set -x

python3 manage.py makemigrations
python3 manage.py migrate --noinput

crontab /srv/crontab.conf
cron -L /proc/1/fd/1

gunicorn --reload --config /srv/gunicorn_config.py api.wsgi:application