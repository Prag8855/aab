FROM python:3.11-slim AS base

# Install dependencies
COPY requirements.txt /requirements.txt
RUN apt-get update \
    && apt-get install -y --no-install-recommends cron rsync \
    && pip3 install --no-cache-dir -r /requirements.txt

COPY gunicorn_config.py crontab.conf start.sh /srv
EXPOSE 80

# = PROD =======================================================================

FROM base AS prod
ENV DEBUG=0
COPY src/ /srv/app/

WORKDIR /srv/app
CMD /srv/start.sh

# = DEV ========================================================================

FROM base AS dev
ENV DEBUG=1

WORKDIR /srv/app
CMD /srv/start.sh