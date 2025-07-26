from forms.models import HealthInsuranceQuestion
from django.contrib import admin


class HealthInsuranceQuestionAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'creation_date', 'referrer']


admin.site.register(HealthInsuranceQuestion, HealthInsuranceQuestionAdmin)
