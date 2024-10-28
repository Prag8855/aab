from django.urls import include, path
from forms.views import HealthInsuranceQuestionViewSet, HealthInsuranceQuestionConfirmationViewSet, \
    PensionRefundQuestionViewSet, PensionRefundReminderViewSet, PensionRefundRequestViewSet, \
    ResidencePermitFeedbackViewSet, TaxIdRequestFeedbackReminderViewSet
from rest_framework import routers

router = routers.DefaultRouter(trailing_slash=False)
router.register('health-insurance-question', HealthInsuranceQuestionViewSet)
router.register('health-insurance-question-confirmation', HealthInsuranceQuestionConfirmationViewSet)
router.register('pension-refund-question', PensionRefundQuestionViewSet)
router.register('pension-refund-reminder', PensionRefundReminderViewSet)
router.register('pension-refund-request', PensionRefundRequestViewSet)
router.register('residence-permit-feedback', ResidencePermitFeedbackViewSet)
router.register('tax-id-request-feedback-reminder', TaxIdRequestFeedbackReminderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
