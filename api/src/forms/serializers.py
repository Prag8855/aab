from django_countries.serializers import CountryFieldMixin
from forms.models import PensionRefundQuestion
from rest_framework.serializers import HyperlinkedModelSerializer, IntegerField


class PensionRefundQuestionSerializer(CountryFieldMixin, HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = PensionRefundQuestion
        fields = [
            'country_of_residence',
            'email',
            'name',
            'nationality',
            'question',
            'status',
        ]
