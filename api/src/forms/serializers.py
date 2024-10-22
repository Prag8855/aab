from forms.models import PensionRefundQuestion
from rest_framework import serializers


class PensionRefundQuestionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = PensionRefundQuestion
        fields = [
            'country_of_residence',
            'email',
            'name',
            'nationality',
            'question',
        ]
