from django.db import models
from django_countries.fields import CountryField
from typing import List
from django.template.loader import render_to_string


filler_string = "AAAAA"
filler_email = "AAAAA@AAAAA.COM"


class MessageStatus(models.IntegerChoices):
    SCHEDULED = 0, "Scheduled"
    FAILED = 1, "Error"
    SENT = 2, "Sent"
    REDACTED = 3, "Sent and redacted for privacy"


class ScheduledMessage(models.Model):
    creation_date = models.DateTimeField(auto_now_add=True)
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

    class PrivacyMeta:
        fields = ['name', 'email']


scheduled_message_models = [
    PensionRefundQuestion,
]
