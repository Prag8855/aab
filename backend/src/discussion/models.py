from django.contrib.auth.models import User
from django.db import models


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    parent_thread = models.CharField(max_length=150)
    parent_comment = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="children")
    message = models.TextField()
    creation_date = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
