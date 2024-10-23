from django_countries.serializers import CountryFieldMixin
from forms.models import HealthInsuranceQuestion, HealthInsuranceQuestionConfirmation, PensionRefundQuestion, \
    PensionRefundReminder, PensionRefundRequest, TaxIdRequestFeedbackReminder
from rest_framework.serializers import HyperlinkedModelSerializer, IntegerField


default_fields = [
    'creation_date',
    'delivery_date',
    'status',
]


class HealthInsuranceQuestionSerializer(HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = HealthInsuranceQuestion
        fields = [
            *default_fields,
            'age',
            'email',
            'income_over_limit',
            'name',
            'occupation',
            'phone',
            'question',
        ]


class HealthInsuranceQuestionConfirmationSerializer(HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = HealthInsuranceQuestionConfirmation
        fields = [
            *default_fields,
            'email',
            'name',
        ]


class PensionRefundQuestionSerializer(CountryFieldMixin, HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = PensionRefundQuestion
        fields = [
            *default_fields,
            'country_of_residence',
            'email',
            'name',
            'nationality',
            'question',
        ]


class PensionRefundReminderSerializer(CountryFieldMixin, HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = PensionRefundReminder
        fields = [
            *default_fields,
            'email',
            'refund_amount',
        ]


class PensionRefundRequestSerializer(CountryFieldMixin, HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = PensionRefundRequest
        fields = [
            *default_fields,
            'arrival_date',
            'birth_date',
            'country_of_residence',
            'departure_date',
            'email',
            'name',
            'nationality',
            'partner',
        ]


class TaxIdRequestFeedbackReminderSerializer(HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = TaxIdRequestFeedbackReminder
        fields = [
            *default_fields,
            'email',
            'name',
        ]
