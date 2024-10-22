from django.urls import include, path
from forms.views import PensionRefundQuestionViewSet
from rest_framework import routers

router = routers.DefaultRouter(trailing_slash=False)
router.register(r'pension-refund-question', PensionRefundQuestionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
