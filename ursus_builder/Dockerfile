FROM python:3.10-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade --no-cache-dir ursus@git+https://github.com/nicbou/ursus@master
COPY ./watch-for-updates.sh /watch-for-updates.sh

CMD /watch-for-updates.sh