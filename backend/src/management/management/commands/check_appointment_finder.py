from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.timesince import timesince
from management.models import update_monitor
import asyncio
import json
import logging
import websockets

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Check the status of the Bürgeramt appointment finder"

    async def get_appointment_finder_message(self) -> tuple[int, str, datetime | None]:
        # In prod, calling allaboutberlin.com calls 127.0.1.1 instead (loopback interface)
        # Nginx rejects requests from that address because the host isn't allaboutberlin.com
        # So we just ping the appointment finder server directly.
        async with websockets.connect("ws://128.140.76.17") as websocket:
            # Wait for welcome message with 5-second timeout
            data = json.loads(await asyncio.wait_for(websocket.recv(), timeout=5))
            if data["lastAppointmentsFoundOn"]:
                last_appointments_found_on = datetime.fromisoformat(
                    data["lastAppointmentsFoundOn"].replace("Z", "+00:00")
                ).astimezone()
            else:
                last_appointments_found_on = None

        return data["status"], data["message"], last_appointments_found_on

    def handle(self, *args, **options):
        status = logging.INFO

        try:
            http_status, message, last_appointments_found_on = asyncio.run(self.get_appointment_finder_message())
        except Exception as e:
            logger.exception("Could not fetch appointment finder status")
            http_status, message, last_appointments_found_on = 500, str(e), None

        if http_status != 200:
            status = logging.WARNING
            if (
                http_status == 500
                or last_appointments_found_on is None
                or (timezone.now() - last_appointments_found_on) > timedelta(days=1)
            ):
                status = logging.ERROR

        last_find = (
            f"Last appointments found {timesince(last_appointments_found_on)} ago."
            if last_appointments_found_on
            else "No appointments found yet"
        )

        update_monitor("appointment-finder", status, f"{http_status} - {message or 'No message'}. {last_find}")
