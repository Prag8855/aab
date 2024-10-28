from forms.models import HealthInsuranceQuestion, HealthInsuranceQuestionConfirmation, PensionRefundQuestion, \
    PensionRefundReminder, PensionRefundRequest, ResidencePermitFeedback, TaxIdRequestFeedbackReminder
from forms.serializers import HealthInsuranceQuestionSerializer, HealthInsuranceQuestionConfirmationSerializer, \
    PensionRefundQuestionSerializer, PensionRefundReminderSerializer, PensionRefundRequestSerializer, \
    ResidencePermitFeedbackSerializer, TaxIdRequestFeedbackReminderSerializer
from rest_framework import mixins, permissions, viewsets


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
    """
    Feedback can be posted anonymously.
    It can be read with people who have the modification_key.
    It can only be listed by admins.
    """

    def has_permission(self, request, view):
        if request.method in ('POST', 'PUT'):
            return True
        elif request.method == 'GET':
            if view.action == 'retrieve':
                return True
            else:
                return request.user and request.user.is_superuser
        return False


class FeedbackViewSet(mixins.UpdateModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    http_method_names = ['get', 'post', 'put']
    permission_classes = [FeedbackPermission]


class HealthInsuranceQuestionViewSet(MessageViewSet):
    queryset = HealthInsuranceQuestion.objects.all()
    serializer_class = HealthInsuranceQuestionSerializer


class HealthInsuranceQuestionConfirmationViewSet(MessageViewSet):
    http_method_names = ['get']  # This model is created automatically
    queryset = HealthInsuranceQuestionConfirmation.objects.all()
    serializer_class = HealthInsuranceQuestionConfirmationSerializer


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
    serializer_class = ResidencePermitFeedbackSerializer


class TaxIdRequestFeedbackReminderViewSet(MessageViewSet):
    queryset = TaxIdRequestFeedbackReminder.objects.all()
    serializer_class = TaxIdRequestFeedbackReminderSerializer
