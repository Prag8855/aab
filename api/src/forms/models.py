from django.db import models


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
    nationality = models.CharField(max_length=150)
    country_of_residence = models.CharField(max_length=150)
    question = models.TextField()

    template_name = 'pension-refund-question.html'
    recipient = 'partner@fundsback.org'
    reply_to_sender = True
