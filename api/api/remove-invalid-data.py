#!/usr/bin/env python3
from email_validator import validate_email, EmailNotValidError
import config
import json
import logging
import sqlite3

logging.basicConfig(**config.logging_config)
logger = logging.getLogger(__name__)


def email_is_valid(email: str) -> bool:
    try:
        validate_email(email, check_deliverability=True)
    except EmailNotValidError:
        return False
    else:
        return True


if __name__ == '__main__':
    connection = sqlite3.connect(
        "/var/db/api.db",
        detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES
    )
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()

    # Remove personal data from database after 90 days
    cursor.execute('''
        SELECT * FROM scheduled_message
        WHERE is_sent = 0
    ''')
    messages = cursor.fetchall()

    invalid_count = 0
    for message in messages:
        template_values = json.loads(message['template_values'])
        if not message['recipients'] or not email_is_valid(template_values['email']):
            logger.warning(f"Deleting invalid message {message['id']} - {message['template_values']}")
            cursor.execute("DELETE FROM scheduled_message WHERE id = :id", {'id': message['id']})
            invalid_count += 1

    connection.commit()
    logger.info(f'Removed {invalid_count} invalid messages')
