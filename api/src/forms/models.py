from django.db import models
from django_countries.fields import CountryField


class MessageStatus(models.IntegerChoices):
    SCHEDULED = 0, "Scheduled"
    FAILED = 1, "Error"
    SENT = 2, "Sent"


class ScheduledMessage(models.Model):
    creation_date = models.DateTimeField(auto_now_add=True)
    status = models.PositiveSmallIntegerField(choices=MessageStatus, default=MessageStatus.SCHEDULED)

    class Meta:
        abstract = True


class PensionRefundQuestion(ScheduledMessage):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    nationality = CountryField()
    country_of_residence = CountryField()
    question = models.TextField()

    template_name = 'pension-refund-question.html'
    recipient = 'partner@fundsback.org'
    reply_to_sender = True
