from forms.models import PensionRefundQuestion
from forms.serializers import PensionRefundQuestionSerializer
from rest_framework import viewsets


class PensionRefundQuestionViewSet(viewsets.ModelViewSet):
    queryset = PensionRefundQuestion.objects.all()
    serializer_class = PensionRefundQuestionSerializer
