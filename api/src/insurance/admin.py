from django.contrib import admin
from nested_admin import NestedModelAdmin, NestedStackedInline, NestedGenericStackedInline
from insurance.models import Customer, Case, Comment, Commission, Outcome


class CommentInline(NestedGenericStackedInline):
    model = Comment
    fields = ('comment', 'file', 'date_created')
    readonly_fields = ('date_created', )
    extra = 0

    def has_change_permission(self, *args):
        return False  # Prevent editing comments

    def has_delete_permission(self, *args):
        return False  # Prevent editing comments


class CommissionInline(NestedStackedInline):
    model = Commission
    extra = 0


class OutcomeInline(NestedStackedInline):
    model = Outcome
    extra = 0

    inlines = [CommissionInline, ]

    def has_change_permission(self, *args):
        return False  # Prevent editing comments

    def has_delete_permission(self, *args):
        return False  # Prevent editing comments


class CaseAdmin(NestedModelAdmin):
    fields = ('customer', 'title', 'description', 'referrer')
    inlines = [CommentInline, OutcomeInline]
    exclude = ["insured_persons"]
    list_display = ['title', 'customer__name', 'date_created', 'referrer']


class CustomerAdmin(admin.ModelAdmin):
    pass


admin.site.register(Case, CaseAdmin)
admin.site.register(Customer, CustomerAdmin)
