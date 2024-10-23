from django.urls import include, path
from forms.views import HealthInsuranceQuestionViewSet, PensionRefundQuestionViewSet, PensionRefundRequestViewSet
from rest_framework import routers

router = routers.DefaultRouter(trailing_slash=False)
router.register(r'health-insurance-question', HealthInsuranceQuestionViewSet)
router.register(r'pension-refund-question', PensionRefundQuestionViewSet)
router.register(r'pension-refund-request', PensionRefundRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
