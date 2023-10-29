#!/usr/bin/env python3
from main import app, remove_old_personal_data
import config
import logging
import requests

logging.basicConfig(**config.logging_config)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    with app.app_context():
        remove_old_personal_data()
        requests.get('https://uptime.betterstack.com/api/v1/heartbeat/e16SBzikSMqckEs6wvNmkoAE')
