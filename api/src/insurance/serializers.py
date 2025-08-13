from rest_framework import serializers
from .models import Case, InsuredPerson


class InsuredPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuredPerson
        exclude = ('case',)


class CaseSerializer(serializers.ModelSerializer):
    insured_persons = InsuredPersonSerializer(many=True)

    class Meta:
        model = Case
        fields = '__all__'

    def create(self, validated_data):
        insured_persons = validated_data.pop('insured_persons')
        case = Case.objects.create(**validated_data)
        for insured_person in insured_persons:
            InsuredPerson.objects.create(case=case, **insured_person)
        return case
