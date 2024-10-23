from forms.models import HealthInsuranceQuestion, HealthInsuranceQuestionConfirmation, PensionRefundQuestion, \
    PensionRefundReminder, PensionRefundRequest, TaxIdRequestFeedbackReminder
from forms.serializers import HealthInsuranceQuestionSerializer, HealthInsuranceQuestionConfirmationSerializer, \
    PensionRefundQuestionSerializer, PensionRefundReminderSerializer, PensionRefundRequestSerializer, \
    TaxIdRequestFeedbackReminderSerializer
from rest_framework import mixins, permissions, viewsets


class MessagePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method == 'POST':
            return True
        elif request.method == 'GET':
            return request.user and request.user.is_authenticated
        return False


class MessageViewset(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    http_method_names = ['get', 'post']
    permission_classes = [MessagePermission]


class HealthInsuranceQuestionViewSet(MessageViewset):
    queryset = HealthInsuranceQuestion.objects.all()
    serializer_class = HealthInsuranceQuestionSerializer


class HealthInsuranceQuestionConfirmationViewSet(MessageViewset):
    http_method_names = ['get']  # This model is created automatically
    queryset = HealthInsuranceQuestionConfirmation.objects.all()
    serializer_class = HealthInsuranceQuestionConfirmationSerializer


class PensionRefundQuestionViewSet(MessageViewset):
    queryset = PensionRefundQuestion.objects.all()
    serializer_class = PensionRefundQuestionSerializer


class PensionRefundReminderViewSet(MessageViewset):
    queryset = PensionRefundReminder.objects.all()
    serializer_class = PensionRefundReminderSerializer


class PensionRefundRequestViewSet(MessageViewset):
    queryset = PensionRefundRequest.objects.all()
    serializer_class = PensionRefundRequestSerializer


class TaxIdRequestFeedbackReminderViewSet(MessageViewset):
    queryset = TaxIdRequestFeedbackReminder.objects.all()
    serializer_class = TaxIdRequestFeedbackReminderSerializer
