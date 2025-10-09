from django.urls import path, include
from .views import CaseViewSet
from rest_framework import routers

router = routers.DefaultRouter(trailing_slash=False)
router.register(r'case', CaseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
