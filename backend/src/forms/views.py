from django.core.exceptions import ValidationError as DjangoValidationError
from forms.models import (
    CitizenshipFeedback,
    PensionRefundQuestion,
    PensionRefundReminder,
    PensionRefundRequest,
    ResidencePermitFeedback,
    TaxIdRequestFeedbackReminder,
)
from forms.serializers import (
    CitizenshipFeedbackSerializer,
    PensionRefundQuestionSerializer,
    PensionRefundReminderSerializer,
    PensionRefundRequestSerializer,
    PublicCitizenshipFeedbackSerializer,
    PublicResidencePermitFeedbackSerializer,
    ResidencePermitFeedbackSerializer,
    TaxIdRequestFeedbackReminderSerializer,
)
from forms.utils import readable_date_range, readable_duration
from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.serializers import as_serializer_error
from rest_framework.views import exception_handler as drf_exception_handler
from typing import Any


class MessagePermission(permissions.BasePermission):
    """
    Messages can be posted anonymously, but only read by admins
    """

    def has_permission(self, request, view):
        if request.method in ("POST", "PUT"):
            return True
        elif request.method == "GET":
            return request.user and request.user.is_superuser
        return False


class MessageViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    http_method_names = ["get", "post"]
    permission_classes = [MessagePermission]


class FeedbackPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method == "DELETE":
            return request.user and request.user.is_superuser
        return True


class FeedbackViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "put", "delete"]
    permission_classes = [FeedbackPermission]


class PensionRefundQuestionViewSet(MessageViewSet):
    queryset = PensionRefundQuestion.objects.all()
    serializer_class = PensionRefundQuestionSerializer


class PensionRefundReminderViewSet(MessageViewSet):
    queryset = PensionRefundReminder.objects.all()
    serializer_class = PensionRefundReminderSerializer


class PensionRefundRequestViewSet(MessageViewSet):
    queryset = PensionRefundRequest.objects.all()
    serializer_class = PensionRefundRequestSerializer


class ResidencePermitFeedbackViewSet(FeedbackViewSet):
    queryset = ResidencePermitFeedback.objects.all()
    admin_serializer_class = ResidencePermitFeedbackSerializer
    public_serializer_class = PublicResidencePermitFeedbackSerializer
    filter_params = ["residence_permit_type", "department"]

    def get_serializer_class(self):
        if self.request.method == "GET" and not self.request.user.is_authenticated:
            return self.public_serializer_class
        return self.admin_serializer_class

    def get_queryset(self):
        filters = {
            param: self.request.query_params[param]
            for param in self.filter_params
            if param in self.request.query_params
        }
        if self.action == "list":
            # Filter out useless feedback, but allow retrieving a single item anyway
            filters["first_response_date__isnull"] = False
        return self.queryset.filter(**filters)

    def get_stats(self, request) -> dict[str, Any]:
        extra_filters = {param: request.query_params.get(param) for param in self.filter_params}
        return {
            "first_response_date": ResidencePermitFeedback.objects.wait_time(
                "application_date", "first_response_date", extra_filters
            ),
            "appointment_date": ResidencePermitFeedback.objects.wait_time(
                "first_response_date", "appointment_date", extra_filters
            ),
            "pick_up_date": ResidencePermitFeedback.objects.wait_time(
                "appointment_date", "pick_up_date", extra_filters
            ),
            "total": ResidencePermitFeedback.objects.wait_time("application_date", "pick_up_date", extra_filters),
        }

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data["stats"] = self.get_stats(request)

        # Add human-readable range string like "1 week to 6 months"
        for stats_dict in response.data["stats"].values():
            if stats_dict["percentile_20"] is not None and stats_dict["percentile_80"] is not None:
                stats_dict["readable_range"] = readable_date_range(
                    days_1=stats_dict["percentile_20"], days_2=stats_dict["percentile_80"]
                )
                stats_dict["readable_average"] = readable_duration(stats_dict["average"])
            else:
                stats_dict["readable_range"] = None
                stats_dict["readable_average"] = None

        return response


class CitizenshipFeedbackViewSet(ResidencePermitFeedbackViewSet):
    queryset = CitizenshipFeedback.objects.all()
    admin_serializer_class = CitizenshipFeedbackSerializer
    public_serializer_class = PublicCitizenshipFeedbackSerializer
    filter_params = ["department"]

    def get_stats(self, request):
        return {
            "first_response_date": CitizenshipFeedback.objects.wait_time("application_date", "first_response_date", {}),
            "appointment_date": CitizenshipFeedback.objects.wait_time("first_response_date", "appointment_date", {}),
            "total": CitizenshipFeedback.objects.wait_time("application_date", "appointment_date", {}),
        }


class TaxIdRequestFeedbackReminderViewSet(MessageViewSet):
    queryset = TaxIdRequestFeedbackReminder.objects.all()
    serializer_class = TaxIdRequestFeedbackReminderSerializer


def exception_handler(exc, context):
    """
    Handle ValidationErrors properly so that they return a 400 instead of a 500
    """
    if isinstance(exc, DjangoValidationError):
        exc = DRFValidationError(as_serializer_error(exc))

    return drf_exception_handler(exc, context)
