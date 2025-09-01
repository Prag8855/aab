from django.contrib import admin
from forms.models import PensionRefundRequest


class PensionRefundRequestAdmin(admin.ModelAdmin):
    list_display = ['name', 'partner', 'nationality', 'country_of_residence', 'creation_date']


admin.site.register(PensionRefundRequest, PensionRefundRequestAdmin)
