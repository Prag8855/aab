#!/bin/sh
set -e
set -x

git reset --hard && \
git pull origin master && \
docker-compose up --build -d