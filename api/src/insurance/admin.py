from django.contrib import admin
from insurance.models import Case, InsuredPerson


class InsuredPersonInline(admin.StackedInline):
    model = InsuredPerson
    extra = 0

    fields = (
        ('first_name', 'last_name'),
        'description',
        'occupation', 'income',
        'nationality', 'country_of_residence',
        'is_married',
        'age',
        'date_of_birth',
    )


class CaseAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Case information', {
            'fields': ('creation_date', 'notes', 'referrer'),
        }),
        ('Contact information', {
            'fields': ('broker', 'contact_method', 'name', 'email', 'phone', 'whatsapp')
        }),
    )
    inlines = [InsuredPersonInline, ]

    list_display = ['name', 'title', 'creation_date', 'broker', 'referrer']
    readonly_fields = ['broker', 'creation_date', 'name']


admin.site.register(Case, CaseAdmin)
