from django.conf import settings
from django.core.exceptions import ValidationError
from email_validator import validate_email as original_validate_email, EmailNotValidError
from typing import List
import random
import requests


def random_key():
    return '{k:032x}'.format(k=random.getrandbits(128))


def validate_email(email: str) -> bool:
    try:
        original_validate_email(email, check_deliverability=True)
    except EmailNotValidError as exc:
        raise ValidationError("Invalid email") from exc


def send_email(recipients: List[str], subject: str, body: str, reply_to: str = None):
    message_data = {
        "from": "All About Berlin <contact@allaboutberlin.com>",
        "to": recipients,
        "subject": subject,
        "html": body,
    }

    if reply_to:
        message_data['h:Reply-To'] = reply_to

    response = requests.post(
        "https://api.eu.mailgun.net/v3/allaboutberlin.com/messages",
        auth=("api", settings.MAILGUN_API_KEY),
        data=message_data
    )

    if response.status_code != 200:
        raise Exception("Mailgun request returned status %s. %s" % (response.status_code, response.json()))
