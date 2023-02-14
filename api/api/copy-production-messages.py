#!/usr/bin/env python3
from datetime import datetime
from main import app, db, engine, ScheduledMessage
import config
import json
import logging
import requests

logging.basicConfig(**config.logging_config)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    with app.app_context():
        ScheduledMessage.__table__.drop(engine)
        db.create_all()

        api_response = requests.get('https://allaboutberlin.com/api/reminders?key=2258374419').json()

        for json_message in api_response['messages']:
            logger.info('Scheduling 1 message of type %s' % json_message['messageType'])
            scheduled_message = ScheduledMessage(
                recipients=",".join(json_message['recipients']),
                message_type=json_message['messageType'],
                delivery_date=datetime.fromisoformat(json_message['deliveryDate']),
                creation_date=datetime.fromisoformat(json_message['creationDate']),
                template_values=json.dumps(json_message['templateValues']),
                is_sent=json_message['isSent']
            )
            db.session.add(scheduled_message)
        db.session.commit()
