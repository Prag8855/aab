from .models import Case
from .serializers import CaseSerializer
from forms.views import MessageViewSet


class CaseViewSet(MessageViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
