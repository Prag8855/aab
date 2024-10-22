FROM tiangolo/uwsgi-nginx-flask:python3.8-alpine

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Install crontab to process the message queue
COPY crontab.conf /tmp/crontab.conf
RUN crontab /tmp/crontab.conf

# Disable nginx request logging
# access.log is symlinked to stdout
RUN rm /var/log/nginx/access.log

COPY ./api /app

CMD crond -L /proc/1/fd/1 && /start.sh
