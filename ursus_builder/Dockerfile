FROM python:3.10-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade --no-cache-dir ursus@https://github.com/nicbou/ursus/archive/master.zip
COPY ./watch-for-updates.sh /watch-for-updates.sh
ARG GITHUB_PERSONAL_ACCESS_TOKEN

CMD /watch-for-updates.sh