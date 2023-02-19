#!/usr/bin/env bash
source .env
set -e

echo "Copying database to $1"
docker-compose cp "api:/var/db/api.db" $1
