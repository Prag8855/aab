from datetime import datetime
from flask import Flask
from flask import json
from flask import request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy_utils import create_database, database_exists
from typing import List
from werkzeug.exceptions import HTTPException, BadRequest, NotFound
import config
import logging
import os
import requests

logging.basicConfig(**config.logging_config)
logger = logging.getLogger(__name__)


app = Flask(__name__)


@app.errorhandler(HTTPException)
def handle_http_exception(e):
    """Return JSON instead of HTML for HTTP errors."""
    response = e.get_response()
    response.data = json.dumps({
        'url': request.url,
        'status': 'error',
        'code': e.code,
        'message': e.description,
    })
    response.content_type = 'application/json'

    if e.code != 404:
        logger.error(response.data)
    return response


@app.errorhandler(Exception)
def handle_exception(e):
    logger.exception(e)
    return {'status': 'error', 'code': 500, 'message': 'Internal Server Error'}, 500


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)


app.json_encoder = CustomJSONEncoder


engine = create_engine(config.db_url)
if not database_exists(engine.url):
    logger.info("Creating missing API database")
    create_database(engine.url)

app.config['SQLALCHEMY_DATABASE_URI'] = config.db_url
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_pre_ping": True,
    "pool_recycle": 240,
}

db = SQLAlchemy(app)


class ScheduledMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recipients = db.Column(db.String(640), nullable=False)
    message_type = db.Column(db.String(150), nullable=False)
    creation_date = db.Column(db.DateTime, default=datetime.utcnow)
    delivery_date = db.Column(db.DateTime)
    template_values = db.Column(db.Text)
    is_sent = db.Column(db.Boolean, default=False)


def schedule_message(message_type: str, recipients: List[str], delivery_date: datetime, template_values: dict):
    logger.info('Scheduling 1 message of type %s' % message_type)
    scheduled_message = ScheduledMessage(
        recipients=",".join(recipients),
        message_type=message_type,
        delivery_date=delivery_date,
        template_values=json.dumps(template_values),
    )
    db.session.add(scheduled_message)
    db.session.commit()


def send_message(message_type: str, recipients: List[str], template_values: dict):
    message_path = os.path.join(config.base_path, config.message_types[message_type]['template_path'])
    with open(message_path, 'r') as message_file:
        message_body = message_file.read()

    response = requests.post(
        "https://api.eu.mailgun.net/v3/allaboutberlin.com/messages",
        auth=("api", os.environ['MAILGUN_API_KEY']),
        data={
            "from": "All About Berlin <contact@allaboutberlin.com>",
            "to": recipients,
            "subject": config.message_types[message_type]['title'].format(**template_values),
            "html": message_body.format(**template_values),
        }
    )
    if response.status_code != 200:
        raise Exception("Mailgun request returned status %s and message %s" % (response.status_code, response.json()))


def send_queued_messages():
    messages = ScheduledMessage.query.filter(
        ScheduledMessage.is_sent == False, # noqa
        ScheduledMessage.delivery_date <= datetime.now()
    )
    logger.info('Sending scheduled messages')
    successes = 0
    failures = 0
    for message in messages:
        try:
            full_template_values = json.loads(message.template_values)
            full_template_values.update({
                'recipients': ", ".join(message.recipients),
                'creationDate': message.creation_date,
                'deliveryDate': message.delivery_date,
            })
            send_message(message.message_type, message.recipients, full_template_values)
            message.is_sent = True
            db.session.add(message)
            successes += 1
        except:
            logger.exception("Could not send scheduled message")
            failures += 1

    log_message = 'Sent scheduled messages (%i ok, %i not ok)' % (successes, failures)
    if failures:
        logger.error(log_message)
    else:
        logger.info(log_message)
    db.session.commit()


@app.route("/reminders/<reminder_type>", methods=['POST'])
def set_reminder(reminder_type):
    message_type = f'reminders/{reminder_type}'
    if message_type not in config.message_types:
        raise NotFound('Reminder type does not exist')

    form_data = request.get_json()

    # Common bot hammering this API
    if form_data.get('email', '').endswith('@email.tst'):
        raise BadRequest()

    recipients = [form_data.get('email'), ]

    json_delivery_date = form_data.get('deliveryDate', None)
    if json_delivery_date:
        delivery_date = datetime.strptime(json_delivery_date, '%Y-%m-%dT%H:%M:%S.%fZ')
    else:
        delivery_date = datetime.now()

    schedule_message(
        message_type,
        recipients,
        delivery_date,
        form_data,
    )

    return {'status': 'success'}


@app.route("/reminders", methods=['GET'])
def get_reminders():
    api_key = request.args.get('key', default='', type=str)
    if api_key != '2258374419':
        raise BadRequest()

    messages = ScheduledMessage.query.all()
    json_messages = []
    for message in messages:
        json_messages.append({
            'messageType': message.message_type,
            'recipients': message.recipients.split(','),
            'deliveryDate': message.delivery_date,
            'creationDate': message.creation_date,
            'isSent': message.is_sent,
            'templateValues': json.loads(message.template_values),
        })

    return {'messages': json_messages}


@app.route("/forms/<form_type>", methods=['POST'])
def send_form(form_type):
    message_type = f'forms/{form_type}'
    if message_type not in config.message_types:
        raise BadRequest('Form type does not exist')

    message_config = config.message_types[message_type]

    form_data = request.get_json()

    # Common bot hammering this API
    if form_data.get('email', '').endswith('@email.tst'):
        raise BadRequest()

    recipients = message_config['recipients']
    json_delivery_date = form_data.get('deliveryDate', None)
    if json_delivery_date:
        delivery_date = datetime.strptime(json_delivery_date, '%Y-%m-%dT%H:%M:%S.%fZ')
    else:
        delivery_date = datetime.now()

    schedule_message(
        message_type,
        recipients,
        delivery_date,
        form_data
    )

    return {'status': 'success'}


with app.app_context():
    db.create_all()
