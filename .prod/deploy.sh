#!/bin/sh
set -e
set -x

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Pulling new changes"
git reset --hard && \
git pull origin master && \

echo "Rebuilding project"
docker-compose up --build -d

echo "Reinstalling production deployment scripts"
${PROJECT_ROOT}/.prod/setup.sh