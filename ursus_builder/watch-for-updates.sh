#!/bin/sh
# Pulls the latest version of All About Berlin and rebuilds it as needed
set -e

if [ ! -d /var/ursus/site/.git ]
then
    git clone https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/nicbou/aab.git /var/ursus/site
fi

while true; do
    git -C /var/ursus/site fetch > /dev/null
    if ! (git -C /var/ursus/site diff --exit-code master..origin/master > /dev/null)
    then
        git pull;
        ursus -c /var/ursus/site/ursus_config.py;
    else
        sleep 60
    fi
done