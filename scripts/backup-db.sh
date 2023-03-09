#!/usr/bin/env bash
source .env
set -e

DB_CONTAINER=`docker-compose ps -q api`

echo "Copying database to $1"
docker cp "${DB_CONTAINER}:/var/db/api.db" $1
echo "Database backup done."
