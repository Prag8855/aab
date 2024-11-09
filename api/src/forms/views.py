from django.core.exceptions import ValidationError as DjangoValidationError
from forms.models import HealthInsuranceQuestion, PensionRefundQuestion, PensionRefundReminder, PensionRefundRequest, \
    ResidencePermitFeedback, TaxIdRequestFeedbackReminder
from forms.serializers import HealthInsuranceQuestionSerializer, \
    PensionRefundQuestionSerializer, PensionRefundReminderSerializer, PensionRefundRequestSerializer, \
    PublicResidencePermitFeedbackSerializer, ResidencePermitFeedbackSerializer, TaxIdRequestFeedbackReminderSerializer
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


class FeedbackViewSet(mixins.UpdateModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    http_method_names = ['get', 'post', 'put']


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
