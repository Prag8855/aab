from django.urls import path
from .views import ThreadCommentsView
from rest_framework import routers

router = routers.DefaultRouter(trailing_slash=False)

urlpatterns = [
    path("thread/<slug:slug>/", ThreadCommentsView.as_view()),
]
