from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from forms.models import HealthInsuranceQuestion, PensionRefundQuestion, PensionRefundReminder, PensionRefundRequest, \
    ResidencePermitFeedback, TaxIdRequestFeedbackReminder
from forms.serializers import HealthInsuranceQuestionSerializer, \
    PensionRefundQuestionSerializer, PensionRefundReminderSerializer, PensionRefundRequestSerializer, \
    PublicResidencePermitFeedbackSerializer, ResidencePermitFeedbackSerializer, TaxIdRequestFeedbackReminderSerializer
from forms.utils import readable_date_range
from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.serializers import as_serializer_error
from rest_framework.views import exception_handler as drf_exception_handler


class MessagePermission(permissions.BasePermission):
    """
    Messages can be posted anonymously, but only read by admins
    """

    def has_permission(self, request, view):
        if request.method in ('POST', 'PUT'):
            return True
        elif request.method == 'GET':
            return request.user and request.user.is_superuser
        return False


class MessageViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    http_method_names = ['get', 'post']
    permission_classes = [MessagePermission]


class FeedbackPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method == 'DELETE':
            return request.user and request.user.is_superuser
        return True


class FeedbackViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'put', 'delete']
    permission_classes = [FeedbackPermission]


class HealthInsuranceQuestionViewSet(MessageViewSet):
    queryset = HealthInsuranceQuestion.objects.all()
    serializer_class = HealthInsuranceQuestionSerializer


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

    def get_serializer_class(self):
        if self.request.method == 'GET' and not self.request.user.is_authenticated:
            return PublicResidencePermitFeedbackSerializer
        return ResidencePermitFeedbackSerializer

    def get_queryset(self):
        """
        Optionally restricts the returned purchases to a given user,
        by filtering against a `username` query parameter in the URL.
        """
        params = ['residence_permit_type', 'department']
        filters = {
            param: self.request.query_params[param]
            for param in params
            if param in self.request.query_params
        }
        return self.queryset.filter(**filters)

    @method_decorator(cache_page(60 * 60 * 2))
    @method_decorator(vary_on_headers("Authorization"))
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        rpt = request.query_params.get('residence_permit_type')
        d = request.query_params.get('department')
        response.data['stats'] = {
            'first_response_date': ResidencePermitFeedback.objects.wait_time('application_date', 'first_response_date', rpt, d),
            'appointment_date': ResidencePermitFeedback.objects.wait_time('first_response_date', 'appointment_date', rpt, d),
            'pick_up_date': ResidencePermitFeedback.objects.wait_time('appointment_date', 'pick_up_date', rpt, d),
            'total': ResidencePermitFeedback.objects.wait_time('application_date', 'pick_up_date', rpt, d),
        }

        # Add human-readable range string like "1 week to 6 months"
        for stats_dict in response.data['stats'].values():
            if stats_dict['percentile_20'] is not None and stats_dict['percentile_80'] is not None:
                stats_dict['readable_range'] = readable_date_range(days_1=stats_dict['percentile_20'], days_2=stats_dict['percentile_80'])
            else:
                stats_dict['readable_range'] = None

        return response


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
