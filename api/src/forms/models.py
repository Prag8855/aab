from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.core.exceptions import ValidationError
from django.db import models
from django.template.loader import render_to_string
from django.utils import timezone
from django_countries.fields import CountryField
from forms.utils import random_key, validate_email
from typing import List
import logging


logger = logging.getLogger(__name__)
filler_string = "AAAAA"
filler_email = "AAAAA@AAAAA.COM"
filler_datetime = datetime(year=2000, month=1, day=1)
filler_date = filler_datetime.date()


class EmailMixin(models.Model):
    email = models.EmailField(validators=[validate_email])

    def remove_personal_data(self):
        super().remove_personal_data()
        self.email = filler_email

    class Meta:
        abstract = True


class BaseModel(models.Model):
    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    class Meta:
        abstract = True


class MessageStatus(models.IntegerChoices):
    SCHEDULED = 0, "Scheduled"
    FAILED = 1, "Error"
    SENT = 2, "Sent"
    REDACTED = 3, "Sent and redacted for privacy"


class ResidencePermitTypes(models.TextChoices):
    BLUE_CARD = 'BLUE_CARD', "Blue Card"


class ScheduledMessage(BaseModel):
    creation_date = models.DateTimeField(auto_now_add=True)
    delivery_date = models.DateTimeField(default=timezone.now)
    status = models.PositiveSmallIntegerField(choices=MessageStatus, default=MessageStatus.SCHEDULED)

    def save(self, *args, **kwargs):
        logger.info(f'Scheduling 1 message ({self.__class__.__name__})')
        super().save(*args, **kwargs)

    def remove_personal_data(self):
        self.status = MessageStatus.REDACTED

    def get_recipients(self) -> List[str]:
        raise NotImplemented()

    def get_subject(self) -> str:
        raise NotImplemented()

    def get_body(self) -> str:
        raise NotImplemented()

    def get_reply_to(self) -> str:
        return None

    class Meta:
        abstract = True


class ScheduledReminder(EmailMixin, ScheduledMessage):
    """
    Reminders are sent to the sender, not to a third party
    """

    def get_recipients(self):
        return [self.email, ]

    class Meta:
        abstract = True


class HealthInsuranceQuestion(EmailMixin, ScheduledMessage):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30, blank=True)
    income_over_limit = models.BooleanField()  # Above or below the Versicherungspflichtgrenze
    occupation = models.CharField(max_length=50)  # "Self-employed"
    age = models.PositiveSmallIntegerField()
    question = models.TextField()

    def save(self, *args, **kwargs):
        if not self.pk:
            HealthInsuranceQuestionConfirmation.objects.create(email=self.email, name=self.name)
        super().save(*args, **kwargs)

    def remove_personal_data(self):
        super().remove_personal_data()
        self.name = filler_string
        self.phone = filler_string

    def get_recipients(self) -> List[str]:
        return ['hello@feather-insurance.com', ]

    def get_subject(self) -> str:
        return f"Health insurance question from {self.name} (All About Berlin)"

    def get_body(self) -> str:
        return render_to_string('health-insurance-question.html', {'message': self})

    def get_reply_to(self) -> str:
        return self.email


class HealthInsuranceQuestionConfirmation(EmailMixin, ScheduledMessage):
    name = models.CharField(max_length=150)

    def get_recipients(self) -> List[str]:
        return [self.email, ]

    def get_subject(self) -> str:
        return f"Feather will contact you soon"

    def get_body(self) -> str:
        return render_to_string('health-insurance-question-confirmation.html', {'message': self})


class PensionRefundQuestion(EmailMixin, ScheduledMessage):
    name = models.CharField(max_length=150)
    nationality = CountryField()
    country_of_residence = CountryField()
    question = models.TextField()

    def remove_personal_data(self):
        super().remove_personal_data()
        self.name = filler_string

    def get_recipients(self) -> List[str]:
        return ['partner@fundsback.org', ]

    def get_subject(self) -> str:
        return f"Pension refund question from {self.name} (All About Berlin)"

    def get_body(self) -> str:
        return render_to_string('pension-refund-question.html', {'message': self})

    def get_reply_to(self) -> str:
        return self.email


pension_refund_partners = {
    'fundsback': 'partner@fundsback.org',
    'germanypensionrefund': 'refund@germanypensionrefund.com',
    'pensionrefundgermany': 'support@pension-refund.com',
}


class PensionRefundRequest(EmailMixin, ScheduledMessage):
    name = models.CharField(max_length=150)
    nationality = CountryField()
    country_of_residence = CountryField()
    arrival_date = models.DateField()
    departure_date = models.DateField()
    birth_date = models.DateField()
    partner = models.CharField(max_length=30, choices=pension_refund_partners)

    def remove_personal_data(self):
        super().remove_personal_data()
        self.name = filler_string
        self.birth_date = filler_date

    def get_recipients(self) -> List[str]:
        return [pension_refund_partners[self.partner], ]

    def get_subject(self) -> str:
        return f"Pension refund request from {self.name} (All About Berlin)"

    def get_body(self) -> str:
        return render_to_string('pension-refund-request.html', {'message': self})

    def get_reply_to(self) -> str:
        return self.email


class PensionRefundReminder(ScheduledReminder):
    refund_amount = models.PositiveIntegerField()

    def get_subject(self) -> str:
        return f"Reminder: you can now get your German pension payments back"

    def get_body(self) -> str:
        return render_to_string('pension-refund-reminder.html', {'message': self})


def in_8_weeks():
    return timezone.now() + timedelta(weeks=8)


class TaxIdRequestFeedbackReminder(ScheduledReminder):
    name = models.CharField(max_length=150)
    delivery_date = models.DateTimeField(default=in_8_weeks)

    def get_subject(self) -> str:
        return f"Did you receive your tax ID?"

    def get_body(self) -> str:
        return render_to_string('tax-id-request-feedback-reminder.html', {'message': self})


class Feedback(BaseModel):
    modification_key = models.CharField(primary_key=True, max_length=32, unique=True, default=random_key)
    creation_date = models.DateTimeField(auto_now_add=True)
    modification_date = models.DateTimeField(auto_now=True)
    email = models.EmailField(validators=[validate_email], blank=True, null=True)

    class Meta:
        abstract = True


class ResidencePermitFeedback(Feedback):
    residence_permit_type = models.CharField(choices=ResidencePermitTypes, max_length=30)
    application_date = models.DateField()
    first_response_date = models.DateField(null=True, blank=True)
    appointment_date = models.DateField(null=True, blank=True)
    pick_up_date = models.DateField(null=True, blank=True)

    nationality = CountryField()
    notes = models.TextField(blank=True)

    def clean(self):
        if self.first_response_date and self.application_date > self.first_response_date:
            raise ValidationError("application_date can't be after first_response_date")
        if self.appointment_date and self.first_response_date > self.appointment_date:
            raise ValidationError("first_response_date can't be after appointment_date")
        if self.pick_up_date and self.appointment_date > self.pick_up_date:
            raise ValidationError("appointment_date can't be after pick_up_date")

    def save(self, *args, **kwargs):
        """
        Schedule feedback reminders in the future
        """
        self.feedback_reminders.all().delete()

        if self.email and self.pick_up_date:
            self.email = filler_email

        super().save(*args, **kwargs)

        # No feedback email needed if the feedback is complete
        if self.email and not self.pick_up_date:
            self.feedback_reminders.create(
                email=self.email,
                delivery_date=timezone.now() + relativedelta(months=2)
            )
            if not self.appointment_date:
                self.feedback_reminders.create(
                    email=self.email,
                    delivery_date=timezone.now() + relativedelta(months=6)
                )


class ResidencePermitFeedbackReminder(ScheduledReminder):
    feedback = models.ForeignKey(ResidencePermitFeedback, related_name='feedback_reminders', on_delete=models.CASCADE)

    def get_subject(self) -> str:
        return f"Did you get your residence permit?"

    def get_body(self) -> str:
        return render_to_string('residence-permit-feedback-reminder.html', {'message': self})


scheduled_message_models = [
    HealthInsuranceQuestion,
    HealthInsuranceQuestionConfirmation,
    PensionRefundQuestion,
    PensionRefundRequest,
    PensionRefundReminder,
    ResidencePermitFeedbackReminder,
    TaxIdRequestFeedbackReminder,
]
