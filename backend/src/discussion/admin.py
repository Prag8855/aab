from django.contrib import admin
from .models import Comment


class CommentAdmin(admin.ModelAdmin):
    list_display = ["parent_thread", "user"]


admin.site.register(Comment, CommentAdmin)
