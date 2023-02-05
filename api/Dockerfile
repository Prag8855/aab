FROM tiangolo/uwsgi-nginx-flask:python3.8-alpine

RUN apk upgrade --update \
  && apk add -U tzdata \
  && cp /usr/share/zoneinfo/Europe/Berlin /etc/localtime \
  && apk del tzdata \
  && rm -rf /var/cache/apk/* \
  && apk add --no-cache mariadb-connector-c-dev \
  && apk add --no-cache --virtual .build-deps \
        build-base \
        mariadb-dev

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt && apk del .build-deps

# Install crontab to process the message queue
COPY crontab.conf /tmp/crontab.conf
RUN crontab /tmp/crontab.conf

# Disable nginx request logging
# access.log is symlinked to stdout
RUN rm /var/log/nginx/access.log

CMD crond -L /proc/1/fd/1 && /start.sh
