from django.urls import include, path
from forms.views import HealthInsuranceQuestionViewSet, PensionRefundQuestionViewSet
from rest_framework import routers

router = routers.DefaultRouter(trailing_slash=False)
router.register(r'health-insurance-question', HealthInsuranceQuestionViewSet)
router.register(r'pension-refund-question', PensionRefundQuestionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
