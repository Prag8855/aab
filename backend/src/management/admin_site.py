from collections import OrderedDict
from datetime import datetime, time
from django.apps import apps
from django.contrib import admin
from django.urls import reverse
from django.utils import timezone
from management.models import Monitor, error_icons
from typing import Any


def get_daily_digest_models() -> list[dict[str, Any]]:
    midnight = datetime.combine(timezone.now().date(), time.min, tzinfo=timezone.now().tzinfo)

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
            for instance in model.objects.filter(creation_date__gte=midnight)
        ],
    } for model in apps.get_models() if hasattr(model, 'daily_digest_fields')]


def get_daily_digest_monitors() -> list[dict[str, Any]]:
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


class CustomAdminSite(admin.AdminSite):
    site_header = 'All About Berlin'
    site_title = "Dashboard"
    index_title = "Overview"
    index_template = 'admin/dashboard.html'

    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['models'] = get_daily_digest_models()
        extra_context['monitors'] = get_daily_digest_monitors()

        return super().index(request, extra_context=extra_context)
