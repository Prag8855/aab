from base64 import b64encode
from copy import copy
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from django.contrib.auth.models import User
from django.utils import timezone
from forms.models import HealthInsuranceQuestion, HealthInsuranceQuestionConfirmation, PensionRefundQuestion, \
    PensionRefundReminder, PensionRefundRequest, ResidencePermitFeedback, TaxIdRequestFeedbackReminder
from rest_framework.test import APITestCase


def basic_auth_headers(username: str, password: str) -> dict:
    return {
        "Authorization": "Basic {}".format(b64encode(bytes(f'{username}:{password}', 'utf-8')).decode('ascii'))
    }


class ScheduledMessageEndpointMixin:
    def test_create(self):
        response = self.client.post(self.endpoint, self.example_request, format='json')
        self.assertEqual(response.status_code, 201)

    def test_list_unauthenticated_401(self):
        response = self.client.get(self.endpoint)
        self.assertEqual(response.status_code, 401)

    def test_list_invalidcredentials_401(self):
        User.objects.create_superuser('myuser', 'myemail@test.com', 'testpassword')
        response = self.client.get(self.endpoint, headers=basic_auth_headers('myuser', 'WRONGpassword'))
        self.assertEqual(response.status_code, 401)

    def test_list_200(self):
        User.objects.create_superuser('myuser', 'myemail@test.com', 'testpassword')
        response = self.client.get(self.endpoint, headers=basic_auth_headers('myuser', 'testpassword'))
        self.assertEqual(response.status_code, 200)

    def test_retrieve_exists_404(self):
        new_object = self.model.objects.create(**self.example_request)
        response = self.client.get(f'{self.endpoint}/{new_object.pk}')
        self.assertEqual(response.status_code, 404)

    def test_retrieve_notexists_404(self):
        response = self.client.get(f'{self.endpoint}/invalidmodificationkey')
        self.assertEqual(response.status_code, 404)

    def test_delete_all_401(self):
        response = self.client.delete(self.endpoint)
        self.assertEqual(response.status_code, 401)

    def test_delete_one_404(self):
        new_object = self.model.objects.create(**self.example_request)
        response = self.client.delete(f'{self.endpoint}/{new_object.pk}')
        self.assertEqual(response.status_code, 404)


class FeedbackEndpointMixin:
    def test_create(self):
        response = self.client.post(self.endpoint, self.example_request, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('modification_key', response.json())

    def test_update(self):
        new_object = self.model.objects.create(**self.example_request)
        updated_request = copy(self.example_request)
        updated_request['email'] = "contact@allaboutberlin.com"
        response = self.client.put(f"{self.endpoint}/{new_object.modification_key}", updated_request, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self.model.objects.get(modification_key=new_object.modification_key).email,
            updated_request['email']
        )

    def test_list_unauthenticated_401(self):
        response = self.client.get(self.endpoint)
        self.assertEqual(response.status_code, 401)

    def test_list_invalidcredentials_401(self):
        User.objects.create_superuser('myuser', 'myemail@test.com', 'testpassword')
        response = self.client.get(self.endpoint, headers=basic_auth_headers('myuser', 'WRONGpassword'))
        self.assertEqual(response.status_code, 401)

    def test_list_200(self):
        User.objects.create_superuser('myuser', 'myemail@test.com', 'testpassword')
        response = self.client.get(self.endpoint, headers=basic_auth_headers('myuser', 'testpassword'))
        self.assertEqual(response.status_code, 200)

    def test_retrieve_200(self):
        new_object = self.model.objects.create(**self.example_request)
        response = self.client.get(f'{self.endpoint}/{new_object.modification_key}')
        self.assertEqual(response.status_code, 200)

    def test_retrieve_404(self):
        response = self.client.get(f'{self.endpoint}/invalidmodificationkey')
        self.assertEqual(response.status_code, 404)

    def test_delete_all_401(self):
        response = self.client.delete(self.endpoint)
        self.assertEqual(response.status_code, 401)

    def test_delete_one_401(self):
        new_object = self.model.objects.create(**self.example_request)
        response = self.client.delete(f'{self.endpoint}/{new_object.pk}')
        self.assertEqual(response.status_code, 401)

    def test_delete_one_authenticated_403(self):
        User.objects.create_superuser('myuser', 'myemail@test.com', 'testpassword')
        new_object = self.model.objects.create(**self.example_request)
        response = self.client.delete(
            f'{self.endpoint}/{new_object.pk}', headers=basic_auth_headers('myuser', 'testpassword')
        )
        self.assertEqual(response.status_code, 403)


class HealthInsuranceQuestionTestCase(ScheduledMessageEndpointMixin, APITestCase):
    model = HealthInsuranceQuestion
    endpoint = '/forms/health-insurance-question'
    example_request = {
        'name': 'John Test',
        'email': 'contact@nicolasbouliane.com',
        'phone': '',
        'income_over_limit': False,
        'occupation': 'employee',
        'age': 23,
        'question': 'I am John and I have questions',
    }

    def test_create_confirmation_message(self):
        self.client.post(self.endpoint, self.example_request, format='json')
        HealthInsuranceQuestionConfirmation.objects.get(email='contact@nicolasbouliane.com', name='John Test')


class PensionRefundQuestionTestCase(ScheduledMessageEndpointMixin, APITestCase):
    model = PensionRefundQuestion
    endpoint = '/forms/pension-refund-question'
    example_request = {
        'name': 'John Test',
        'email': 'contact@nicolasbouliane.com',
        'nationality': 'CA',
        'country_of_residence': 'CA',
        'question': 'I am John and I have questions',
    }


class PensionRefundRequestTestCase(ScheduledMessageEndpointMixin, APITestCase):
    model = PensionRefundRequest
    endpoint = '/forms/pension-refund-request'
    example_request = {
        'arrival_date': '2017-07-01',
        'departure_date': '2020-01-01',
        'birth_date': '1990-10-01',
        'nationality': 'CA',
        'country_of_residence': 'CA',
        'email': 'contact@nicolasbouliane.com',
        'name': 'John Test',
        'partner': 'fundsback',
    }

    def test_create_invalid_nationality_400(self):
        bad_request = copy(self.example_request)
        bad_request['nationality'] = 'XX'
        response = self.client.post(self.endpoint, bad_request, format='json')
        self.assertEqual(response.status_code, 400)

    def test_create_invalid_country_of_residence_400(self):
        bad_request = copy(self.example_request)
        bad_request['country_of_residence'] = 'XX'
        response = self.client.post(self.endpoint, bad_request, format='json')
        self.assertEqual(response.status_code, 400)

    def test_create_invalid_partner_400(self):
        bad_request = copy(self.example_request)
        bad_request['partner'] = 'notapartner'
        response = self.client.post(self.endpoint, bad_request, format='json')
        self.assertEqual(response.status_code, 400)


class PensionRefundReminderTestCase(ScheduledMessageEndpointMixin, APITestCase):
    model = PensionRefundReminder
    endpoint = '/forms/pension-refund-reminder'
    example_request = {
        'email': 'contact@nicolasbouliane.com',
        'refund_amount': 9000,
        'delivery_date': timezone.now() + relativedelta(months=6),
    }


class TaxIdRequestFeedbackReminderTestCase(ScheduledMessageEndpointMixin, APITestCase):
    model = TaxIdRequestFeedbackReminder
    endpoint = '/forms/tax-id-request-feedback-reminder'
    example_request = {
        'email': 'contact@nicolasbouliane.com',
        'name': 'John Test',
    }

    def test_create_delivery_date(self):
        self.client.post(self.endpoint, self.example_request, format='json')
        reminder = self.model.objects.get(email='contact@nicolasbouliane.com', name='John Test')
        self.assertEqual(
            timezone.now().replace(second=0, microsecond=0),
            reminder.creation_date.replace(second=0, microsecond=0)
        )
        self.assertEqual(
            reminder.delivery_date.replace(microsecond=0),
            (reminder.creation_date + timedelta(weeks=8)).replace(microsecond=0)
        )


class ResidencePermitFeedbackTestCase(FeedbackEndpointMixin, APITestCase):
    model = ResidencePermitFeedback
    endpoint = '/forms/residence-permit-feedback'
    example_request = {
        'email': 'contact@nicolasbouliane.com',
        'application_date': '2023-01-01',
        'first_response_date': '2023-02-02',
        'appointment_date': None,
        'pick_up_date': None,
        'nationality': 'CA',
        'notes': 'Just some notes',
        'residence_permit_type': 'BLUE_CARD',
    }

    def test_date_order_400(self):
        request = {
            'application_date': '2023-02-02',
            'first_response_date': '2023-01-01',  # Smaller than application_date
            'nationality': 'CA',
            'residence_permit_type': 'BLUE_CARD',
        }
        response = self.client.post(self.endpoint, request, format='json')
        self.assertEqual(response.status_code, 400)

        request = {
            'application_date': '2023-02-02',
            'first_response_date': '2023-03-03',
            'appointment_date': '2023-02-02',  # Smaller than first_response_date
            'nationality': 'CA',
            'residence_permit_type': 'BLUE_CARD',
        }
        response = self.client.post(self.endpoint, request, format='json')
        self.assertEqual(response.status_code, 400)

        request = {
            'application_date': '2023-02-02',
            'first_response_date': '2023-03-03',
            'appointment_date': '2023-04-04',
            'pick_up_date': '2023-03-03',  # Smaller than appointment_date
            'nationality': 'CA',
            'residence_permit_type': 'BLUE_CARD',
        }
        response = self.client.post(self.endpoint, request, format='json')
        self.assertEqual(response.status_code, 400)

    def test_schedule_feedback_email(self):
        response = self.client.post(self.endpoint, self.example_request, format='json')
        new_object = self.model.objects.get(modification_key=response.json()['modification_key'])
        reminders = list(new_object.feedback_reminders.all().order_by('delivery_date'))
        self.assertEqual(len(reminders), 2)

        self.assertEqual(
            reminders[0].delivery_date.replace(microsecond=0),
            (reminders[0].creation_date + relativedelta(months=2)).replace(microsecond=0)
        )
        self.assertEqual(
            reminders[1].delivery_date.replace(microsecond=0),
            (reminders[1].creation_date + relativedelta(months=6)).replace(microsecond=0)
        )

    def test_schedule_feedback_email_only_pickup_left(self):
        request = copy(self.example_request)
        request['appointment_date'] = '2023-03-03'
        response = self.client.post(self.endpoint, request, format='json')
        new_object = self.model.objects.get(modification_key=response.json()['modification_key'])
        reminders = list(new_object.feedback_reminders.all())
        self.assertEqual(len(reminders), 1)

        self.assertEqual(
            reminders[0].delivery_date.replace(microsecond=0),
            (reminders[0].creation_date + relativedelta(months=2)).replace(microsecond=0)
        )

    def test_no_feedback_email_if_feedback_complete(self):
        request = copy(self.example_request)
        request['appointment_date'] = '2023-03-03'
        request['pick_up_date'] = '2023-04-04'
        response = self.client.post(self.endpoint, request, format='json')
        new_object = self.model.objects.get(modification_key=response.json()['modification_key'])
        self.assertEqual(new_object.feedback_reminders.count(), 0)

    def test_no_feedback_email_if_email_missing(self):
        request = copy(self.example_request)
        request['email'] = ''
        response = self.client.post(self.endpoint, request, format='json')
        new_object = self.model.objects.get(modification_key=response.json()['modification_key'])
        self.assertEqual(new_object.feedback_reminders.count(), 0)
