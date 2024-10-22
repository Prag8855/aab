FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git rsync \
    && pip3 install --no-cache-dir logtail-python==0.3.0 \
    && rm -rf /var/lib/apt/lists/* \
    && git config --global pull.rebase false \
    && mkdir -p /var/ursus/output

COPY ./watch-for-updates.py /watch-for-updates.py

CMD /watch-for-updates.py