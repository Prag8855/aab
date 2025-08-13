from rest_framework import viewsets
from .models import Case, InsuredPerson
from .serializers import CaseSerializer, InsuredPersonSerializer
from forms.views import MessageViewSet


class CaseViewSet(MessageViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
