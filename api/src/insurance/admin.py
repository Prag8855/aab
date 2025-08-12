from django.contrib import admin
from insurance.models import Case, Comment, InsuredPerson, Outcome, Status
from nested_admin import NestedModelAdmin, NestedStackedInline


class CommentInline(NestedStackedInline):
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


class StatusFilter(admin.SimpleListFilter):
    title = "Status"
    parameter_name = "status"

    def lookups(self, request, model_admin):
        return [
            ("open", "Open"),
            ("closed", "Closed"),
        ]

    def queryset(self, request, queryset):
        if self.value() == "open":
            return queryset.filter(status__in=[Status.NEW, Status.IN_PROGRESS, Status.WAITING_CLIENT, Status.WAITING_INSURER])
        elif self.value() == "closed":
            return queryset.filter(status__in=[Status.RESOLVED, Status.ACCEPTED, Status.REJECTED])
        return queryset


class CaseAdmin(NestedModelAdmin):
    fieldsets = (
        ('Case information', {
            'fields': ('status', 'creation_date', 'title', 'notes', 'referrer'),
        }),
        ('Contact information', {
            'fields': ('email', 'phone', 'whatsapp')
        }),
    )
    inlines = [InsuredPersonInline, CommentInline, OutcomeInline]

    list_display = ['name', 'creation_date', 'referrer', 'status']
    list_filter = [StatusFilter]
    readonly_fields = ['creation_date', 'status', ]


admin.site.register(Case, CaseAdmin)
