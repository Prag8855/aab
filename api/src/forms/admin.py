from django.contrib import admin
from forms.models import PensionRefundRequest, PensionRefundQuestion


class PensionRefundQuestionAdmin(admin.ModelAdmin):
    list_display = ['name', 'nationality', 'country_of_residence', 'question', 'creation_date']


class PensionRefundRequestAdmin(admin.ModelAdmin):
    list_display = ['name', 'partner', 'nationality', 'country_of_residence', 'creation_date']


admin.site.register(PensionRefundRequest, PensionRefundRequestAdmin)
admin.site.register(PensionRefundQuestion, PensionRefundQuestionAdmin)
