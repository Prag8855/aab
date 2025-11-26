from rest_framework import generics
from rest_framework.exceptions import NotFound
from .models import Comment
from .serializers import CommentSerializer


class ThreadCommentsView(generics.ListAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        thread = self.kwargs.get("slug")
        exists = Comment.objects.filter(parent_thread=thread).exists()
        if not exists:
            raise NotFound()

        return Comment.objects.filter(
            parent_thread=thread,
            parent_comment=None,
        ).prefetch_related("children", "children__children")
