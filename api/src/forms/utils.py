from django.conf import settings
from email_validator import validate_email, EmailNotValidError
from typing import List
import requests


def email_is_valid(email: str) -> bool:
    try:
        validate_email(email, check_deliverability=True)
    except EmailNotValidError:
        return False
    else:
        return True


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
