from collections import OrderedDict
from datetime import timedelta
from django.apps import apps
from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import timezone
from forms.utils import send_email
from management.models import Monitor, update_monitor, error_icons
from requests.exceptions import HTTPError
from typing import Any
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Send a daily digest to the admins'

    def get_models(self) -> dict[str, Any]:
        return [{
            'name': model._meta.verbose_name_plural.capitalize(),
            'url': reverse("admin:%s_%s_changelist" % (model._meta.app_label, model._meta.model_name)),
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

    def get_monitors(self) -> list[dict[str, Any]]:
        return [{
            'icon': error_icons[monitor.status],
            'status': monitor.status,
            'name': monitor.name or monitor.key,
            'last_updated': monitor.last_updated,
            'message': monitor.last_update.message,
            'url': reverse(
                "admin:%s_%s_change" % (monitor._meta.app_label, monitor._meta.model_name),
                args=[monitor.pk]
            ),
        } for monitor in Monitor.objects.all()]

    def handle(self, *args, **options):
        error_level = logging.INFO

        models = self.get_models()
        monitors = self.get_monitors()

        context = {
            'models': models,
            'monitors': monitors,
        }

        error_level = max(logging.INFO, *[m['status'] for m in monitors])

        subject = f"{error_icons[error_level]} All About Berlin daily digest"
        recipients = User.objects.filter(is_superuser=True).values_list("email", flat=True)
        body = render_to_string('daily-digest.html', context)

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
            logger.exception(f"Could not send daily digest  (HTTP {exc.response.status_code})")
            update_monitor('daily-digest', logging.ERROR, f"Could not send daily digest (HTTP {exc.response.status_code})")
        except Exception as exc:
            logger.exception(f"Could not send daily digest")
            update_monitor('daily-digest', logging.ERROR, str(exc))
        else:
            logger.info('Sent daily digest.')
            update_monitor('daily-digest', logging.INFO)
