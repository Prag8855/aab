from datetime import timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver
from insurance.models import Case, CustomerNotification, BrokerNotification, FeedbackNotification


@receiver(post_save, sender=Case)
def send_new_case_notifications(sender, instance, created, **kwargs):
    if created:
        CustomerNotification.objects.create(case=instance)
        BrokerNotification.objects.create(case=instance)
        FeedbackNotification.objects.create(
            case=instance,
            delivery_date=instance.creation_date + timedelta(weeks=1)
        )
