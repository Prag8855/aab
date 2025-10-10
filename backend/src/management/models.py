from collections import defaultdict
from django.db import models
import logging


error_icons = defaultdict(
    lambda: "🟥",
    {
        logging.INFO: "🟢",
        logging.WARNING: "🟡",
        logging.ERROR: "🟥",
    },
)


class Monitor(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    key = models.CharField(max_length=50, unique=True)

    @property
    def status(self) -> int:
        return self.last_update.status if self.last_update else logging.INFO

    @property
    def last_updated(self):
        return self.last_update.creation_date if self.last_update else None

    @property
    def last_update(self):
        return self.updates.order_by("-creation_date").first()

    class Meta:
        ordering = ["name", "key"]  # newest first

    def __str__(self):
        return self.name or self.key


class Status(models.IntegerChoices):
    INFO = logging.INFO, "INFO"
    WARNING = logging.WARNING, "WARNING"
    ERROR = logging.ERROR, "ERROR"


class Update(models.Model):
    monitor = models.ForeignKey(Monitor, on_delete=models.CASCADE, related_name="updates")
    creation_date = models.DateTimeField(auto_now_add=True)
    status = models.IntegerField(choices=Status)
    message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-creation_date"]  # newest first

    def __str__(self):
        return f"[{self.get_status_display()}] {self.message[:50]}"


def update_monitor(monitor_key: str, status: int, message: str | None = None) -> None:
    monitor, _ = Monitor.objects.get_or_create(key=monitor_key)
    monitor.updates.create(status=status, message=message)
