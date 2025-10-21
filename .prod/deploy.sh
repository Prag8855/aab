#!/bin/sh
set -e
set -x

mkdir -p /var/log/allaboutberlin
exec >> "/var/log/allaboutberlin/deploy.log" 2>&1

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Pulling new changes"
git reset --hard && \
git pull origin master

echo "Rebuilding project"
docker-compose up --build -d

echo "Reinstalling production deployment scripts"
${PROJECT_ROOT}/.prod/setup.sh