from django_countries.serializers import CountryFieldMixin
from forms.models import HealthInsuranceQuestion, PensionRefundQuestion, \
    PensionRefundReminder, PensionRefundRequest, ResidencePermitFeedback, TaxIdRequestFeedbackReminder
from rest_framework.serializers import HyperlinkedModelSerializer, IntegerField, CharField, DateTimeField


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
            'children_count',
            'desired_service',
            'email',
            'income',
            'is_married',
            'name',
            'occupation',
            'question',
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


residence_permit_feedback_fields = [
    'application_date',
    'appointment_date',
    'creation_date',
    'department',
    'first_response_date',
    'modification_date',
    'notes',
    'pick_up_date',
    'residence_permit_type',
]


class ResidencePermitFeedbackSerializer(HyperlinkedModelSerializer):
    modification_key = CharField(read_only=True)
    modification_date = DateTimeField(read_only=True)

    def validate(self, attrs):
        instance = ResidencePermitFeedback(**attrs)
        instance.clean()
        return attrs

    class Meta:
        model = ResidencePermitFeedback
        fields = [
            *residence_permit_feedback_fields,
            'email',
            'modification_key',
        ]


class PublicResidencePermitFeedbackSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = ResidencePermitFeedback
        fields = residence_permit_feedback_fields


class TaxIdRequestFeedbackReminderSerializer(HyperlinkedModelSerializer):
    status = IntegerField(read_only=True)

    class Meta:
        model = TaxIdRequestFeedbackReminder
        fields = [
            *message_fields,
            'email',
            'name',
        ]
