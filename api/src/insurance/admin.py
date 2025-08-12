from django.contrib import admin
from nested_admin import NestedModelAdmin, NestedStackedInline, NestedGenericStackedInline
from insurance.models import Case, Comment, InsuredPerson, Outcome


class CommentInline(NestedGenericStackedInline):
    model = Comment
    fields = ('status', 'notes', 'file')
    readonly_fields = ('creation_date', )
    extra = 0

    def has_change_permission(self, *args):
        return False  # Prevent editing comments

    def has_delete_permission(self, *args):
        return False  # Prevent editing comments


class OutcomeInline(NestedStackedInline):
    model = Outcome
    extra = 0

    fieldsets = (
        ('Selected insurance', {
            'fields': ('insurance_type', 'provider', 'policy', 'notes', 'date_start', 'date_end', )
        }),
        ('Commission', {
            'fields': ('commission_amount', 'commission_received_date',),
        }),
    )

    def has_change_permission(self, *args):
        return False  # Prevent editing comments

    def has_delete_permission(self, *args):
        return False  # Prevent editing comments


class InsuredPersonInline(NestedStackedInline):
    model = InsuredPerson
    extra = 0

    def has_change_permission(self, *args):
        return False  # Prevent editing comments

    def has_delete_permission(self, *args):
        return False  # Prevent editing comments


class CaseAdmin(NestedModelAdmin):
    fieldsets = (
        ('Case information', {
            'fields': ('creation_date', 'title', 'notes', 'referrer'),
        }),
        ('Contact information', {
            'fields': ('email', 'phone', 'whatsapp')
        }),
    )
    inlines = [InsuredPersonInline, CommentInline, OutcomeInline]

    list_display = ['name', 'creation_date', 'referrer', 'get_status_display']
    readonly_fields = ['creation_date', 'get_status_display', ]


admin.site.register(Case, CaseAdmin)
