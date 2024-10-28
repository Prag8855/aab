from django_countries.serializers import CountryFieldMixin
from forms.models import HealthInsuranceQuestion, HealthInsuranceQuestionConfirmation, PensionRefundQuestion, \
    PensionRefundReminder, PensionRefundRequest, ResidencePermitFeedback, TaxIdRequestFeedbackReminder
from rest_framework.serializers import HyperlinkedModelSerializer, IntegerField, CharField


message_fields = [
    'creation_date',
    'delivery_date',
    'status',
]


class HealthInsuranceQuestionSerializer(HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = HealthInsuranceQuestion
        fields = [
            *message_fields,
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
            *message_fields,
            'email',
            'name',
        ]


class PensionRefundQuestionSerializer(CountryFieldMixin, HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = PensionRefundQuestion
        fields = [
            *message_fields,
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
            *message_fields,
            'email',
            'refund_amount',
        ]


class PensionRefundRequestSerializer(CountryFieldMixin, HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = PensionRefundRequest
        fields = [
            *message_fields,
            'arrival_date',
            'birth_date',
            'country_of_residence',
            'departure_date',
            'email',
            'name',
            'nationality',
            'partner',
        ]


class ResidencePermitFeedbackSerializer(HyperlinkedModelSerializer):
    modification_key = CharField(read_only=True)

    class Meta:
        model = ResidencePermitFeedback
        fields = [
            'modification_key',
            'application_date',
            'appointment_date',
            'email',
            'first_response_date',
            'nationality',
            'notes',
            'pick_up_date',
            'residence_permit_type',
        ]


class TaxIdRequestFeedbackReminderSerializer(HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = TaxIdRequestFeedbackReminder
        fields = [
            *message_fields,
            'email',
            'name',
        ]
