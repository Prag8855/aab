from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from forms.models import MessageStatus, scheduled_message_models
import requests


class Command(BaseCommand):
    help = 'Removes personal data from the database'

    def handle(self, *args, **options):
        self.stdout.write('Removing old personal data...')
        ninety_days_ago = timezone.now() - timedelta(days=90)

        count = 0
        for model in scheduled_message_models:
            scheduled_messages = model.objects.filter(
                status=MessageStatus.SENT,
                creation_date__lt=ninety_days_ago
            )

            for message in scheduled_messages:
                message.remove_personal_data()
                message.save()
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Removed personal data from {count} records"))
        requests.get('https://uptime.betterstack.com/api/v1/heartbeat/e16SBzikSMqckEs6wvNmkoAE')
