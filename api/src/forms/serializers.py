from django_countries.serializers import CountryFieldMixin
from forms.models import PensionRefundQuestion
from rest_framework.serializers import HyperlinkedModelSerializer


class PensionRefundQuestionSerializer(CountryFieldMixin, HyperlinkedModelSerializer):
    class Meta:
        model = PensionRefundQuestion
        fields = [
            'country_of_residence',
            'email',
            'name',
            'nationality',
            'question',
        ]
