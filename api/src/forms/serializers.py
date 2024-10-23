from django_countries.serializers import CountryFieldMixin
from forms.models import HealthInsuranceQuestion, PensionRefundQuestion
from rest_framework.serializers import HyperlinkedModelSerializer, IntegerField


class HealthInsuranceQuestionSerializer(HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = HealthInsuranceQuestion
        fields = [
            'age',
            'email',
            'income_over_limit',
            'name',
            'occupation',
            'phone',
            'question',
            'status',
        ]


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
