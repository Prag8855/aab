from django.conf import settings
from django.core.exceptions import ValidationError
from email_validator import validate_email as original_validate_email, EmailNotValidError
from typing import List, Tuple
import random
import requests


def random_key() -> str:
    return '{k:032x}'.format(k=random.getrandbits(128))


def fuzzy_readable_duration(days: int) -> Tuple[int, str]:
    """
    Turns a number of days like 45 into a fuzzy duration tuple like (6, 'weeks')
    """
    if days <= 7 * 2:
        return (round(days), 'days')
    elif days <= 7 * 8:
        return (round(days / 7), 'weeks')
    else:
        return (round(days / 30), 'months')


def pluralize(qty, unit):
    # 0 days, 1 day, 2 days...
    return unit.removesuffix('s') if qty == 1 else unit


def readable_duration(days: int) -> str:
    qty, unit = fuzzy_readable_duration(days)
    return f"{qty} {pluralize(qty, unit)}"


def readable_date_range(days_1: int, days_2: int) -> str:
    qty_1, unit_1 = fuzzy_readable_duration(days_1)
    qty_2, unit_2 = fuzzy_readable_duration(days_2)

    if unit_1 == unit_2:
        if qty_1 == qty_2:  # 3 weeks
            return f"{qty_1} {pluralize(qty_1, unit_1)}"
        return f"{qty_1} to {qty_2} {pluralize(qty_2, unit_2)}"  # 3 to 6 weeks

    # 3 weeks to 6 months
    return f"{qty_1} {pluralize(qty_1, unit_1)} to {qty_2} {pluralize(qty_2, unit_2)}"


def validate_email(email: str) -> None:
    try:
        original_validate_email(email, check_deliverability=True)
    except EmailNotValidError as exc:
        raise ValidationError("Invalid email") from exc


def send_email(recipients: List[str], subject: str, body: str, reply_to: str | None = None):
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
