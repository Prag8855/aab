from forms.models import HealthInsuranceQuestion, PensionRefundQuestion, PensionRefundReminder, PensionRefundRequest
from forms.serializers import HealthInsuranceQuestionSerializer, PensionRefundQuestionSerializer, \
    PensionRefundReminderSerializer, PensionRefundRequestSerializer
from rest_framework import mixins, viewsets


class MessageViewset(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    http_method_names = ['get', 'post']


class HealthInsuranceQuestionViewSet(viewsets.ModelViewSet):
    queryset = HealthInsuranceQuestion.objects.all()
    serializer_class = HealthInsuranceQuestionSerializer


class PensionRefundQuestionViewSet(viewsets.ModelViewSet):
    queryset = PensionRefundQuestion.objects.all()
    serializer_class = PensionRefundQuestionSerializer


class PensionRefundReminderViewSet(viewsets.ModelViewSet):
    queryset = PensionRefundReminder.objects.all()
    serializer_class = PensionRefundReminderSerializer


class PensionRefundRequestViewSet(viewsets.ModelViewSet):
    queryset = PensionRefundRequest.objects.all()
    serializer_class = PensionRefundRequestSerializer
