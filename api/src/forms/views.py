from forms.models import HealthInsuranceQuestion, PensionRefundQuestion
from forms.serializers import HealthInsuranceQuestionSerializer, PensionRefundQuestionSerializer
from rest_framework import viewsets


class HealthInsuranceQuestionViewSet(viewsets.ModelViewSet):
    queryset = HealthInsuranceQuestion.objects.all()
    serializer_class = HealthInsuranceQuestionSerializer


class PensionRefundQuestionViewSet(viewsets.ModelViewSet):
    queryset = PensionRefundQuestion.objects.all()
    serializer_class = PensionRefundQuestionSerializer
