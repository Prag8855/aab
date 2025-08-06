from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


class Comment(models.Model):
    """
    A generic note/comment added to a person or case
    """
    customer = models.ForeignKey(to='Customer', on_delete=models.SET_NULL, null=True, related_name='comments')

    date_created = models.DateTimeField(auto_now_add=True)
    comment = models.TextField()
    file = models.FileField("Attachment", upload_to='attachments/', blank=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        verbose_name = "Update"
        ordering = ['-date_created']


class Customer(models.Model):
    """
    The point of contact for an Case
    """
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = PhoneNumberField(blank=True)
    whatsapp = PhoneNumberField(blank=True)

    comments = GenericRelation(Comment)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class InsuredPerson(models.Model):
    """
    A person that is added to an insurance policy.
    """
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    date_of_birth = models.DateField()
    nationality = models.CharField(max_length=100)
    country_of_residence = models.CharField(max_length=100)

    comments = GenericRelation(Comment)

    class Meta:
        ordering = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.customer})"


class Case(models.Model):
    """
    A need that usually results in an insurance policy being signed.
    """
    date_created = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=150, help_text="For example, \"health insurance for a Blue Card\"")
    description = models.TextField(blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='cases')
    insured_persons = models.ManyToManyField('InsuredPerson', related_name='cases', through='CaseInsuredPersons')
    referrer = models.CharField(blank=True, help_text="Part of the commissions will be paid out to that referrer")

    comments = GenericRelation(Comment)

    def __str__(self):
        return f"{self.title} ({self.customer})"


class CaseInsuredPersons(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    insured_person = models.ForeignKey(InsuredPerson, on_delete=models.CASCADE)


class Outcome(models.Model):
    """
    The outcome of an insurance case. A specific type of insurance policy being signed
    """
    INSURANCE_TYPES = [
        ("disability", "Disability insurance"),
        ("health_expat", "Health insurance - Incoming"),
        ("health_private", "Health insurance - Private"),
        ("health_public", "Health insurance - Public"),
        ("health_travel", "Health insurance - Travel"),
        ("health_zusatz", "Health insurance - Supplementary"),
        ("legal", "Legal insurance"),
        ("liability", "Liability insurance"),
        ("other", "Other"),
    ]

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='outcomes')

    insurance_type = models.CharField(max_length=20, choices=INSURANCE_TYPES)
    provider = models.CharField(max_length=100, help_text="For example, \"Ottonova\"")
    policy = models.CharField(max_length=100, help_text="For example, \"Expat Student Plus\"")

    date_start = models.DateField(help_text="When the policy begins")
    date_end = models.DateField(null=True, help_text="When the policy ends, if applicable")


class Commission(models.Model):
    """
    A payment or payment schedule tied to an insurance outcome
    """
    FREQUENCY_CHOICES = [
        ("Once", "once"),
        ("Monthly", "monthly"),
        ("Quarterly", "quarterly"),
        ("Yearly", "yearly"),
    ]

    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE, related_name='commissions')

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES)
    date_start = models.DateField()
    date_end = models.DateField(null=True)

    class Meta:
        verbose_name = "Commission payment"
