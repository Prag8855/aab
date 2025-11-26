from rest_framework import serializers
from .models import Comment


class ThreadSerializer(serializers.Serializer):
    def to_representation(self, instance):
        serializer = CommentSerializer(instance, context=self.context)
        return serializer.data


class CommentSerializer(serializers.ModelSerializer):
    children = ThreadSerializer(many=True, read_only=True)
    is_visible = serializers.ReadOnlyField()

    class Meta:
        model = Comment
        exclude = ("parent_thread",)
