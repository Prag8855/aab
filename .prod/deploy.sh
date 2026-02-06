#!/bin/sh
set -e
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

mkdir -p /var/log/allaboutberlin
exec >> "/var/log/allaboutberlin/deploy.log" 2>&1

log "Deploying All About Berlin"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_ROOT"

log "Pulling new changes"
git reset --hard && git pull origin master

log "Rebuilding project"
docker-compose up --build -d

log "Pruning old docker images"
docker image prune -a -f
docker builder prune -f

log "Reinstalling production deployment scripts"
${PROJECT_ROOT}/.prod/setup.sh