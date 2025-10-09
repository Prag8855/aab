from django.core.management.base import BaseCommand
from django.template.defaultfilters import filesizeformat
from management.models import update_monitor
import logging
import shutil

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Check available disk space'

    def handle(self, *args, **options):
        total, used, free = shutil.disk_usage("/")
        used_percent = round(used / total * 100)
        update_monitor(
            'disk-space',
            logging.ERROR if used_percent > 95 else logging.INFO,
            f"Using {filesizeformat(used)} of {filesizeformat(total)} ({used_percent}%)"
        )
