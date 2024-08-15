#!/usr/bin/env python3
import config
import logging
import requests
import sqlite3

logging.basicConfig(**config.logging_config)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    connection = sqlite3.connect(
        "/var/db/api.db",
        detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES
    )
    cursor = connection.cursor()

    # Remove personal data from database after 90 days
    cursor.execute('''
        UPDATE scheduled_message
        SET
            template_values = NULL,
            recipients = substr(recipients,1, 4) || '...@...'
        WHERE creation_date < datetime('now', '-90 days')
        AND is_sent = 1
    ''')
    logger.info('Removed old personal data')
    requests.get('https://uptime.betterstack.com/api/v1/heartbeat/e16SBzikSMqckEs6wvNmkoAE')
