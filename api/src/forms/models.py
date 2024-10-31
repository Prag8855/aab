from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.conf import settings
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


class ReplyToSenderMixin:
    @property
    def reply_to(self) -> str:
        return self.email


class RecipientIsSenderMixin:
    @property
    def recipients(self) -> str:
        return [self.email, ]


class NameMixin(models.Model):
    name = models.CharField(max_length=150)

    def remove_personal_data(self):
        super().remove_personal_data()
        self.name = filler_string

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
    FAMILY_REUNION_VISA = 'FAMILY_REUNION_VISA', "Family reunion visa"
    FREELANCE_VISA = 'FREELANCE_VISA', "Freelance visa"
    PERMANENT_RESIDENCE = 'PERMANENT_RESIDENCE', "Permanent residence"
    STUDENT_VISA = 'STUDENT_VISA', "Student visa"
    WORK_VISA = 'WORK_VISA', "Work visa"


class ScheduledMessage(BaseModel):
    creation_date = models.DateTimeField(auto_now_add=True)
    delivery_date = models.DateTimeField(default=timezone.now)
    status = models.PositiveSmallIntegerField(choices=MessageStatus, default=MessageStatus.SCHEDULED)

    recipients: List[str] = []
    subject: str = ''
    template: str = None
    reply_to: str = None

    def save(self, *args, **kwargs):
        logger.info(f'Scheduling 1 message ({self.__class__.__name__})')
        if settings.DEBUG_EMAILS:
            logger.info(
                "NEW EMAIL MESSAGE\n"
                f"Created on: \n{self.creation_date}\n"
                f"Deliver on: \n{self.delivery_date}\n"
                f"To: {', '.join(self.recipients)}\n"
                f"Reply-To: {self.reply_to}\n"
                f"Subject: {self.subject}\n"
                f"Body: \n{self.get_body()}"
            )
        super().save(*args, **kwargs)

    def remove_personal_data(self):
        self.status = MessageStatus.REDACTED

    def get_body(self) -> str:
        return render_to_string(self.template(), {'message': self})

    class Meta:
        abstract = True


class Feedback(EmailMixin, BaseModel):
    modification_key = models.CharField(primary_key=True, max_length=32, unique=True, default=random_key)
    creation_date = models.DateTimeField(auto_now_add=True)
    modification_date = models.DateTimeField(auto_now=True)
    email = models.EmailField(validators=[validate_email], blank=True, null=True)

    class Meta:
        abstract = True


class HealthInsuranceQuestion(NameMixin, ReplyToSenderMixin, EmailMixin, ScheduledMessage):
    age = models.PositiveSmallIntegerField()
    income_over_limit = models.BooleanField()  # Above or below the Versicherungspflichtgrenze
    occupation = models.CharField(max_length=50)  # "Self-employed"
    phone = models.CharField(max_length=30, blank=True)
    question = models.TextField()

    recipients = ['hello@feather-insurance.com', ]
    template = 'health-insurance-question.html'

    def save(self, *args, **kwargs):
        if not self.pk:
            HealthInsuranceQuestionConfirmation.objects.create(email=self.email, name=self.name)
        super().save(*args, **kwargs)

    def remove_personal_data(self):
        super().remove_personal_data()
        self.age = 0
        self.occupation = 'unknown'
        self.phone = filler_string

    @property
    def subject(self) -> str:
        return f"Health insurance question from {self.name} (All About Berlin)"


class HealthInsuranceQuestionConfirmation(NameMixin, RecipientIsSenderMixin, EmailMixin, ScheduledMessage):
    subject = 'Feather will contact you soon'
    template = 'health-insurance-question-confirmation.html'


class PensionRefundQuestion(NameMixin, EmailMixin, ScheduledMessage):
    nationality = CountryField()
    country_of_residence = CountryField()
    question = models.TextField()

    recipients = ['partner@fundsback.org', ]
    template = 'pension-refund-question.html'

    @property
    def subject(self) -> str:
        return f"Pension refund question from {self.name} (All About Berlin)"


pension_refund_partners = {
    'fundsback': 'partner@fundsback.org',
    'germanypensionrefund': 'refund@germanypensionrefund.com',
    'pensionrefundgermany': 'support@pension-refund.com',
}


class PensionRefundRequest(NameMixin, ReplyToSenderMixin, EmailMixin, ScheduledMessage):
    arrival_date = models.DateField()
    birth_date = models.DateField()
    country_of_residence = CountryField()
    departure_date = models.DateField()
    nationality = CountryField()
    partner = models.CharField(max_length=30, choices=pension_refund_partners)

    template = 'pension-refund-request.html'

    def remove_personal_data(self):
        super().remove_personal_data()
        self.birth_date = filler_date

    @property
    def recipients(self) -> List[str]:
        return [pension_refund_partners[self.partner], ]

    @property
    def subject(self) -> str:
        return f"Pension refund request from {self.name} (All About Berlin)"


class PensionRefundReminder(RecipientIsSenderMixin, EmailMixin, ScheduledMessage):
    refund_amount = models.PositiveIntegerField()

    subject = "Reminder: you can now get your German pension payments back"
    template = 'pension-refund-reminder.html'


def in_8_weeks():
    return timezone.now() + timedelta(weeks=8)


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


class ResidencePermitFeedbackReminder(RecipientIsSenderMixin, EmailMixin, ScheduledMessage):
    feedback = models.ForeignKey(ResidencePermitFeedback, related_name='feedback_reminders', on_delete=models.CASCADE)

    subject = "Did you get your residence permit?"
    template = 'residence-permit-feedback-reminder.html'


class TaxIdRequestFeedbackReminder(NameMixin, RecipientIsSenderMixin, EmailMixin, ScheduledMessage):
    delivery_date = models.DateTimeField(default=in_8_weeks)

    subject = "Did you receive your tax ID?"
    template = 'tax-id-request-feedback-reminder.html'


scheduled_message_models = [
    HealthInsuranceQuestion,
    HealthInsuranceQuestionConfirmation,
    PensionRefundQuestion,
    PensionRefundRequest,
    PensionRefundReminder,
    ResidencePermitFeedbackReminder,
    TaxIdRequestFeedbackReminder,
]
