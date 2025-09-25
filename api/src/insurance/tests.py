from datetime import timedelta
from django.utils import timezone
from forms.tests import ScheduledMessageEndpointMixin
from insurance.models import Case, CustomerNotification, BrokerNotification, FeedbackNotification
from rest_framework.test import APITestCase


class CaseTestCase(ScheduledMessageEndpointMixin, APITestCase):
    model = Case
    endpoint = '/api/insurance/case'

    def setUp(self):
        self.example_request = {
            'email': 'contact@nicolasbouliane.com',
            'phone': '011111111111',
            'whatsapp': '022222222222',
            'notes': 'Did you ever think that maybe there’s more to life than being really, really... really ridiculously well insured?',
            'referrer': 'partner123',
            'insured_persons': [
                {
                    'name': 'John Smith',
                    'income': 30000,
                    'occupation': 'selfEmployed',
                    'age': 30,
                    'is_married': True,
                }
            ],
        }

    def test_retrieve_exists_404(self):
        self.example_request.pop('insured_persons')
        super().test_retrieve_exists_404()

    def test_delete_one_404(self):
        self.example_request.pop('insured_persons')
        super().test_retrieve_exists_404()

    def test_create_confirmation_message(self):
        self.client.post(self.endpoint, self.example_request, format='json')
        case = Case.objects.get(email='contact@nicolasbouliane.com')
        customer_email = CustomerNotification.objects.get(case=case)
        broker_email = BrokerNotification.objects.get(case=case)
        feedback_email = FeedbackNotification.objects.get(case=case)

        self.assertEqual(
            timezone.now().replace(second=0, microsecond=0),
            customer_email.delivery_date.replace(second=0, microsecond=0)
        )
        self.assertEqual(
            timezone.now().replace(second=0, microsecond=0),
            broker_email.delivery_date.replace(second=0, microsecond=0)
        )

        self.assertEqual(
            timezone.now().replace(second=0, microsecond=0),
            feedback_email.creation_date.replace(second=0, microsecond=0)
        )
        self.assertEqual(
            feedback_email.delivery_date.replace(microsecond=0),
            (feedback_email.creation_date + timedelta(weeks=1)).replace(microsecond=0)
        )


class MinimalCaseTestCase(CaseTestCase):
    """
    Test with minimal data
    """

    def setUp(self):
        self.example_request = {
            'email': 'contact@nicolasbouliane.com',
            'insured_persons': [
                {
                    'name': 'John Smith',
                }
            ],
        }
