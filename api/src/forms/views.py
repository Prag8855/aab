from forms.models import HealthInsuranceQuestion, PensionRefundQuestion, PensionRefundReminder, PensionRefundRequest
from forms.serializers import HealthInsuranceQuestionSerializer, PensionRefundQuestionSerializer, \
    PensionRefundReminderSerializer, PensionRefundRequestSerializer
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


class PensionRefundQuestionViewSet(MessageViewset):
    queryset = PensionRefundQuestion.objects.all()
    serializer_class = PensionRefundQuestionSerializer


class PensionRefundReminderViewSet(MessageViewset):
    queryset = PensionRefundReminder.objects.all()
    serializer_class = PensionRefundReminderSerializer


class PensionRefundRequestViewSet(MessageViewset):
    queryset = PensionRefundRequest.objects.all()
    serializer_class = PensionRefundRequestSerializer
