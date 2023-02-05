#!/usr/bin/env python3
from main import send_queued_messages
import config
import logging
import requests

logging.basicConfig(**config.logging_config)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    send_queued_messages()
    requests.get('https://betteruptime.com/api/v1/heartbeat/Y3Kth6cKVWVp3yVijwQ3nojP')
