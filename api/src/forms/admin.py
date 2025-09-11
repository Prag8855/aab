from django.contrib import admin
from forms.models import PensionRefundRequest, PensionRefundQuestion, ResidencePermitFeedback


class PensionRefundQuestionAdmin(admin.ModelAdmin):
    list_display = ['name', 'nationality', 'country_of_residence', 'question', 'creation_date']


class PensionRefundRequestAdmin(admin.ModelAdmin):
    list_display = ['name', 'partner', 'nationality', 'country_of_residence', 'creation_date']


class ResidencePermitFeedbackAdmin(admin.ModelAdmin):
    list_display = ['short_modification_date', 'has_notes', 'department', 'residence_permit_type', 'application_date', 'first_response_date', 'appointment_date', 'pick_up_date', 'email']

    def short_modification_date(self, obj):
        return obj.modification_date.strftime('%b. %d, %Y')

    short_modification_date.short_description = 'Created'

    def has_notes(self, obj):
        return bool(obj.notes)

    has_notes.boolean = True  # Show as a boolean icon
    has_notes.short_description = "Has notes"


admin.site.register(PensionRefundRequest, PensionRefundRequestAdmin)
admin.site.register(PensionRefundQuestion, PensionRefundQuestionAdmin)
admin.site.register(ResidencePermitFeedback, ResidencePermitFeedbackAdmin)
