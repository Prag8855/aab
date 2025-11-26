from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Comment


User = get_user_model()


class UserInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class ThreadSerializer(serializers.Serializer):
    def to_representation(self, instance):
        serializer = CommentSerializer(instance, context=self.context)
        return serializer.data


class CommentSerializer(serializers.ModelSerializer):
    user = UserInlineSerializer(read_only=True)
    children = ThreadSerializer(many=True, read_only=True)
    is_visible = serializers.ReadOnlyField()

    class Meta:
        model = Comment
        exclude = ("parent_thread",)
