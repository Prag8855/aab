from datetime import timedelta
from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from forms.models import MessageStatus, ScheduledMessage
from management.models import update_monitor
import logging
import requests


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Removes personal data from the database"

    def handle(self, *args, **options):
        try:
            ninety_days_ago = timezone.now() - timedelta(days=90)

            count = 0

            scheduled_message_models = [model for model in apps.get_models() if issubclass(model, ScheduledMessage)]

            for model in scheduled_message_models:
                scheduled_messages = model.objects.filter(status=MessageStatus.SENT, creation_date__lt=ninety_days_ago)

                for message in scheduled_messages:
                    message.remove_personal_data()
                    message.save()
                    count += 1

            logger.info(f"Removed personal data from {count} records")
            update_monitor("gdpr-cleanup", logging.INFO)
        except Exception as exc:
            update_monitor("backup-database", logging.ERROR, str(exc))
        else:
            update_monitor("backup-database", logging.INFO)
