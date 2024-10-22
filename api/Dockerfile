FROM python:3.11-slim

# Install dependencies
COPY requirements.txt /requirements.txt
RUN apt-get update \
    && apt-get install -y --no-install-recommends cron rsync \
    && pip3 install --no-cache-dir -r /requirements.txt

COPY gunicorn_config.py crontab.conf start.sh /srv

WORKDIR /srv/app
EXPOSE 80

CMD /srv/start.sh