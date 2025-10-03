from collections import OrderedDict
from datetime import timedelta
from django.apps import apps
from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import FieldDoesNotExist
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.utils import timezone
from forms.utils import send_email
from django.urls import reverse
from requests.exceptions import HTTPError
import logging
import requests

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Send a daily digest to the admins'

    def handle(self, *args, **options):
        recipients = User.objects.filter(is_superuser=True).values_list("email", flat=True)
        subject = 'All About Berlin daily digest'

        body = render_to_string('daily-digest.html', {
            'models': [{
                'name': model._meta.verbose_name_plural.capitalize(),
                'url': reverse(
                    "admin:%s_%s_changelist" % (model._meta.app_label, model._meta.model_name),
                ),
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
