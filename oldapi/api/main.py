from datetime import datetime
from email_validator import validate_email, EmailNotValidError
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
        level = logging.INFO if 400 <= e.code < 500 else logging.ERROR
        logger.log(level, f"{e.code}: {e.description}")
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


def email_is_valid(email: str) -> bool:
    try:
        validate_email(email, check_deliverability=True)
    except EmailNotValidError:
        return False
    else:
        return True


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
    message_path = config.base_path / config.message_types[message_type]['template_path']
    message_body = message_path.read_text()
    message_data = {
        "from": "All About Berlin <contact@allaboutberlin.com>",
        "to": recipients,
        "subject": config.message_types[message_type]['title'].format(**template_values),
        "html": message_body.format(**template_values),
    }

    if config.message_types[message_type]['reply_to_sender'] and template_values.get('email'):
        message_data['h:Reply-To'] = template_values['email']

    response = requests.post(
        "https://api.eu.mailgun.net/v3/allaboutberlin.com/messages",
        auth=("api", os.environ['MAILGUN_API_KEY']),
        data=message_data
    )
    response.raise_for_status()


def send_queued_messages():
    messages = ScheduledMessage.query.filter(
        ScheduledMessage.is_sent == False, # noqa
        ScheduledMessage.delivery_date <= datetime.now()
    ).all()
    logger.info('Sending scheduled messages')
    successes = 0
    failures = 0
    for message in messages:
        try:
            all_template_values = json.loads(message.template_values)
            all_template_values.update({
                'recipients': ", ".join(message.recipients),
                'creationDate': message.creation_date,
                'deliveryDate': message.delivery_date,
            })
            send_message(message.message_type, message.recipients, all_template_values)
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
def set_reminder(reminder_type: str):
    message_type = f'reminders/{reminder_type}'
    if message_type not in config.message_types:
        raise NotFound('Reminder type does not exist')

    form_data = request.get_json()
    recipient_email = form_data.get('email')

    if not email_is_valid(recipient_email):
        raise BadRequest(f"Invalid email: {recipient_email}")

    json_delivery_date = form_data.get('deliveryDate')
    if json_delivery_date:
        try:
            delivery_date = datetime.strptime(json_delivery_date, '%Y-%m-%dT%H:%M:%S.%fZ')
        except ValueError:
            raise BadRequest(f"Invalid deliveryDate: {json_delivery_date}")
    else:
        delivery_date = datetime.now()

    schedule_message(
        message_type,
        [recipient_email, ],
        delivery_date,
        form_data,
    )

    return {'status': 'success'}


@app.route("/forms/<form_type>", methods=['POST'])
def send_form(form_type: str):
    message_type = f'forms/{form_type}'
    if message_type not in config.message_types:
        raise BadRequest(f'Form type does not exist: {form_type}')

    form_data = request.get_json()

    if not email_is_valid(form_data.get('email')):
        raise BadRequest(f"Invalid email: {form_data.get('email')}")

    json_delivery_date = form_data.get('deliveryDate')
    if json_delivery_date:
        try:
            delivery_date = datetime.strptime(json_delivery_date, '%Y-%m-%dT%H:%M:%S.%fZ')
        except ValueError:
            raise BadRequest(f"Invalid deliveryDate: {json_delivery_date}")
    else:
        delivery_date = datetime.now()

    schedule_message(
        message_type,
        config.message_types[message_type]['recipients'],
        delivery_date,
        form_data
    )

    return {'status': 'success'}


with app.app_context():
    db.create_all()
