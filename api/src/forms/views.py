from forms.models import HealthInsuranceQuestion, PensionRefundQuestion, PensionRefundRequest
from forms.serializers import HealthInsuranceQuestionSerializer, PensionRefundQuestionSerializer, PensionRefundRequestSerializer
from rest_framework import viewsets


class HealthInsuranceQuestionViewSet(viewsets.ModelViewSet):
    queryset = HealthInsuranceQuestion.objects.all()
    serializer_class = HealthInsuranceQuestionSerializer


class PensionRefundQuestionViewSet(viewsets.ModelViewSet):
    queryset = PensionRefundQuestion.objects.all()
    serializer_class = PensionRefundQuestionSerializer


class PensionRefundRequestViewSet(viewsets.ModelViewSet):
    queryset = PensionRefundRequest.objects.all()
    serializer_class = PensionRefundRequestSerializer
