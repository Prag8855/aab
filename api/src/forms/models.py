from datetime import datetime, timedelta
from django.db import models
from django_countries.fields import CountryField
from typing import List
from django.template.loader import render_to_string
from django.utils import timezone


filler_string = "AAAAA"
filler_email = "AAAAA@AAAAA.COM"
filler_datetime = datetime(year=2000, month=1, day=1)
filler_date = filler_datetime.date()


class MessageStatus(models.IntegerChoices):
    SCHEDULED = 0, "Scheduled"
    FAILED = 1, "Error"
    SENT = 2, "Sent"
    REDACTED = 3, "Sent and redacted for privacy"


class ScheduledMessage(models.Model):
    creation_date = models.DateTimeField(auto_now_add=True)
    delivery_date = models.DateTimeField(default=timezone.now)
    status = models.PositiveSmallIntegerField(choices=MessageStatus, default=MessageStatus.SCHEDULED)

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


class ScheduledReminder(ScheduledMessage):
    email = models.EmailField()

    def get_recipients(self):
        return [self.email, ]

    def remove_personal_data(self):
        super().remove_personal_data()
        self.email = filler_email

    class Meta:
        abstract = True


class HealthInsuranceQuestion(ScheduledMessage):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    income_over_limit = models.BooleanField()  # Above or below the Versicherungspflichtgrenze
    occupation = models.CharField(max_length=50)  # "Self-employed"
    age = models.PositiveSmallIntegerField()
    question = models.TextField()

    def save(self, *args, **kwargs):
        if not self.pk:
            confirmation_message = HealthInsuranceQuestionConfirmation(email=self.email, name=self.name)
            confirmation_message.save()
        super(HealthInsuranceQuestion, self).save(*args, **kwargs)

    def remove_personal_data(self):
        super().remove_personal_data()
        self.name = filler_string
        self.email = filler_email
        self.phone = filler_string

    def get_recipients(self) -> List[str]:
        return ['hello@feather-insurance.com', ]

    def get_subject(self) -> str:
        return f"Health insurance question from {self.name} (All About Berlin)"

    def get_body(self) -> str:
        return render_to_string('health-insurance-question.html', {'message': self})

    def get_reply_to(self) -> str:
        return self.email


class HealthInsuranceQuestionConfirmation(ScheduledMessage):
    name = models.CharField(max_length=150)
    email = models.EmailField()

    def get_recipients(self) -> List[str]:
        return [self.email, ]

    def get_subject(self) -> str:
        return f"Feather Insurance will contact you soon"

    def get_body(self) -> str:
        return render_to_string('health-insurance-question-confirmation.html', {'message': self})


class PensionRefundQuestion(ScheduledMessage):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    nationality = CountryField()
    country_of_residence = CountryField()
    question = models.TextField()

    def remove_personal_data(self):
        super().remove_personal_data()
        self.name = filler_string
        self.email = filler_email

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


class PensionRefundRequest(ScheduledMessage):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    nationality = CountryField()
    country_of_residence = CountryField()
    arrival_date = models.DateField()
    departure_date = models.DateField()
    birth_date = models.DateField()
    partner = models.CharField(max_length=30, choices=pension_refund_partners)

    def remove_personal_data(self):
        super().remove_personal_data()
        self.name = filler_string
        self.email = filler_email
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
        return f"Reminder: you can now get a refund for your German pension payments"

    def get_body(self) -> str:
        return render_to_string('pension-refund-reminder.html', {'message': self})


def in_8_weeks():
    return timezone.now() + timedelta(days=7 * 8)


class TaxIdRequestFeedbackReminder(ScheduledReminder):
    delivery_date = models.DateTimeField(default=in_8_weeks)

    def get_subject(self) -> str:
        return f"Did you get your tax ID?"

    def get_body(self) -> str:
        return render_to_string('tax-id-request-feedback-reminder.html', {'message': self})


scheduled_message_models = [
    HealthInsuranceQuestion,
    HealthInsuranceQuestionConfirmation,
    PensionRefundQuestion,
    PensionRefundRequest,
    PensionRefundReminder,
    TaxIdRequestFeedbackReminder,
]
