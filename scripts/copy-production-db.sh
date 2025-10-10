#!/usr/bin/env bash

TMP_DB=${TMPDIR:-/tmp}/api.db

scp "aab:/var/db-backups/$(date -I).db" "$TMP_DB"
docker compose cp "$TMP_DB" backend:/var/db/api.db