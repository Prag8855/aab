from django_countries.serializers import CountryFieldMixin
from rest_framework.serializers import ModelSerializer
from .models import Case, InsuredPerson


class InsuredPersonSerializer(CountryFieldMixin, ModelSerializer):
    class Meta:
        model = InsuredPerson
        exclude = ('case',)


class CaseSerializer(CountryFieldMixin, ModelSerializer):
    insured_persons = InsuredPersonSerializer(many=True)

    class Meta:
        model = Case
        fields = '__all__'

    def create(self, validated_data):
        insured_persons = validated_data.pop('insured_persons')
        case = Case.objects.create(**validated_data)
        for insured_person in insured_persons:
            case.insured_persons.create(**insured_person)
        return case
