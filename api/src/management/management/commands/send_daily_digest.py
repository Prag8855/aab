from collections import OrderedDict, defaultdict
from datetime import datetime, timedelta
from django.apps import apps
from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import timezone
from forms.utils import send_email
from requests.exceptions import HTTPError
import asyncio
import json
import logging
import requests
import websockets

logger = logging.getLogger(__name__)

error_icons = defaultdict(lambda: '🟥', {
    logging.INFO: '🟢',
    logging.WARNING: '🟡',
    logging.ERROR: '🟥',
})


class Command(BaseCommand):
    help = 'Send a daily digest to the admins'

    async def get_appointment_finder_status(self) -> tuple[int, str, datetime | None]:
        async with websockets.connect("wss://allaboutberlin.com/api/appointments") as websocket:
            # Wait for welcome message with 5-second timeout
            data = json.loads(await asyncio.wait_for(websocket.recv(), timeout=5))
            if data["lastAppointmentsFoundOn"]:
                last_appointments_found_on = datetime.fromisoformat(data["lastAppointmentsFoundOn"].replace("Z", "+00:00"))
            else:
                last_appointments_found_on = None

        return data['status'], data['message'], last_appointments_found_on

    def handle(self, *args, **options):
        error_level = logging.INFO

        apt_error_level = logging.INFO
        last_appointments_found_on = None
        try:
            apt_status, apt_message, last_appointments_found_on = asyncio.run(self.get_appointment_finder_status())
        except Exception as e:
            logger.exception("Could not fetch appointment finder status")
            apt_status, apt_message = 500, str(e)

        if apt_status != 200:
            apt_error_level = logging.WARNING
            error_level = max(error_level, logging.WARNING)
            if apt_status == 500 or last_appointments_found_on is None or (timezone.now() - last_appointments_found_on) > timedelta(days=1):
                apt_error_level = logging.ERROR
                error_level = max(error_level, logging.ERROR)

        body = render_to_string('daily-digest.html', {
            'appointment_finder': {
                'icon': error_icons[apt_error_level],
                'status': apt_status,
                'message': apt_message,
                'last_appointments_found_on': last_appointments_found_on,
            },
            'models': [{
                'name': model._meta.verbose_name_plural.capitalize(),
                'url': reverse(
                    "admin:%s_%s_changelist" % (model._meta.app_label, model._meta.model_name),
                ),
                'last_created': model.objects.order_by('-creation_date').first().creation_date,
                'instances': [
                    {
                        'name': str(instance),
                        'url': reverse(
                            "admin:%s_%s_change" % (instance._meta.app_label, instance._meta.model_name),
                            args=[instance.pk]
                        ),
                        'fields': OrderedDict([
                            (
                                instance._meta.get_field(field).verbose_name.capitalize(),
                                getattr(instance, field, None)
                            )
                            for field in instance.daily_digest_fields
                        ])
                    }
                    for instance in model.objects.filter(creation_date__gte=timezone.now() - timedelta(hours=24))
                ],

            } for model in apps.get_models() if hasattr(model, 'daily_digest_fields')]
        })

        subject = f"{error_icons[error_level]} All About Berlin daily digest"
        recipients = User.objects.filter(is_superuser=True).values_list("email", flat=True)

        if settings.DEBUG_EMAILS:
            logger.info('Pretending to send daily digest...')
        else:
            logger.info('Sending daily digest...')

        if not settings.DEBUG and not settings.MAILGUN_API_KEY:
            raise Exception("MAILGUN_API_KEY is not set")

        try:
            if settings.DEBUG:
                if settings.DEBUG_EMAILS:
                    logger.info(
                        "SENDING EMAIL MESSAGE\n"
                        f"To: {', '.join(recipients)}\n"
                        f"Subject: {subject}\n"
                        f"Body: \n{body}"
                    )
                else:
                    logger.info(f"Pretending to send 1 message (daily digest)")
            else:
                send_email(
                    recipients,
                    subject,
                    body,
                )
        except HTTPError as exc:
            logger.exception(f"Could not send daily digest (HTTP {exc.response.status_code})")
        except:
            logger.exception(f"Could not send daily digest")
        else:
            logger.info('Sent daily digest.')
            if not settings.DEBUG:
                requests.get('https://uptime.betterstack.com/api/v1/heartbeat/Jaj5ab3VjaoUsrq5YVGUxJaM')
