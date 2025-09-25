from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django_countries.fields import CountryField
from forms.models import ScheduledMessage


class ContactMethod(models.TextChoices):
    EMAIL = "EMAIL", "Email"
    WHATSAPP = "WHATSAPP", "WhatsApp"
    PHONE = "PHONE", "Phone"


class Occupation(models.TextChoices):
    EMPLOYEE = "employee", "Employee"
    AZUBI = "azubi", "Azubi"
    STUDENT_EMPLOYEE = "studentEmployee", "Student (working)"
    STUDENT_SELFEMPLOYED = "studentSelfEmployed", "Student (self-employed)"
    STUDENT_UNEMPLOYED = "studentUnemployed", "Student (unemployed)"
    SELF_EMPLOYED = "selfEmployed", "Self-employed"
    UNEMPLOYED = "unemployed", "Unemployed"
    OTHER = "other", "Other/unknown"


class Brokers(models.TextChoices):
    CHRISTINA_WEBER = 'christina-weber', "Christina Weber"
    SEAMUS_WOLF = 'seamus-wolf', "Seamus Wolf"


class Case(models.Model):
    """
    A need that usually results in an insurance policy being signed.
    """
    email = models.EmailField(blank=True)
    phone = models.CharField(blank=True, max_length=50)
    whatsapp = models.CharField(blank=True, max_length=50)
    contact_method = models.CharField("Contact method", max_length=15, choices=ContactMethod, default=ContactMethod.EMAIL)

    creation_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField("Initial notes", blank=True, help_text="For future notes, add Updates to the Case.")

    broker = models.CharField(max_length=30, choices=Brokers, default=Brokers.SEAMUS_WOLF)
    referrer = models.CharField(blank=True, help_text="Part of the commissions will be paid out to that referrer")

    @property
    def name(self):
        first_person = self.insured_persons.first()
        return first_person.name if first_person else "(no name)"

    def clean(self):
        super().clean()
        if self.contact_method == ContactMethod.EMAIL and not self.email:
            raise ValidationError({'email': 'Email is required when contact_method is EMAIL.'})

    def save(self, *args, **kwargs):
        if self.email:
            CustomerNotification.objects.get_or_create(case=self)
            FeedbackNotification.objects.get_or_create(case=self)

        if self.contact_method != ContactMethod.WHATSAPP:
            BrokerNotification.objects.get_or_create(case=self)

    @property
    def title(self):
        first_person = self.insured_persons.first()
        facts = []

        if not first_person:
            return ''

        facts.append(self.get_contact_method_display())
        if (person_count := self.insured_persons.count()) > 1:
            facts.append("👤" * person_count)
        if(first_person.occupation):
            facts.append(first_person.get_occupation_display())
        if(first_person.income):
            facts.append(f"€{first_person.income:,.0f}")
        if(first_person.age):
            facts.append(f"{first_person.age}yo")
        if(first_person.is_married is True):
            facts.append("Married")
        elif(first_person.is_married is False):
            facts.append("Not married")

        return " · ".join(facts)

    @property
    def broker_info(self):
        return {
            'christina-weber': {
                'is_male': False,
                'first_name': 'Christina',
                'full_name': 'Christina Weber',
                'email': 'hello@feather-insurance.com',
            },
            'seamus-wolf': {
                'is_male': True,
                'first_name': 'Seamus',
                'full_name': 'Seamus Wolf',
                'email': 'Seamus.Wolf@horizon65.com',
            },
        }[self.broker]

    class Meta:
        ordering = ['-creation_date']

    def __str__(self):
        return f"{self.name} — {self.title}"


class InsuredPerson(models.Model):
    """
    A person that is added to an insurance policy.
    """
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="insured_persons", related_query_name="insured_person")

    name = models.CharField(max_length=100)
    description = models.CharField(blank=True, max_length=250, help_text="For example \"Spouse\"")

    occupation = models.CharField(max_length=50, choices=Occupation, default=Occupation.OTHER)  # "selfEmployed"
    income = models.PositiveIntegerField("Yearly income", blank=True, null=True)
    nationality = CountryField(blank=True)
    country_of_residence = CountryField(blank=True)
    is_married = models.BooleanField(null=True)
    age = models.PositiveSmallIntegerField(blank=True, null=True)

    class Meta:
        verbose_name = "Insured person"

    def __str__(self):
        return self.name


def in_1_week():
    return timezone.now() + timedelta(weeks=1)


class CaseNotificationMixin(ScheduledMessage):
    case = models.ForeignKey(Case, on_delete=models.CASCADE)

    class Meta:
        abstract = True


class CustomerNotification(CaseNotificationMixin, ScheduledMessage):
    template = 'customer-notification.html'

    @property
    def recipients(self) -> list[str]:
        return [self.case.email, ]

    @property
    def subject(self) -> str:
        return f'{self.case.broker_info["first_name"]} will contact you soon'

    class Meta(ScheduledMessage.Meta):
        pass


class BrokerNotification(CaseNotificationMixin, ScheduledMessage):
    template = 'broker-notification.html'

    @property
    def recipients(self) -> list[str]:
        return [self.case.broker_info['email'], ]

    @property
    def subject(self) -> str:
        return f"Insurance question from {self.case.name} (All About Berlin)"

    @property
    def reply_to(self) -> str:
        return self.case.email

    class Meta(ScheduledMessage.Meta):
        pass


class FeedbackNotification(CaseNotificationMixin):
    template = 'feedback-notification.html'
    delivery_date = models.DateTimeField(default=in_1_week)

    @property
    def subject(self) -> str:
        return f'Did {self.case.broker_info["first_name"]} help you get insured?'

    @property
    def recipients(self) -> list[str]:
        return [self.case.email, ]

    class Meta(ScheduledMessage.Meta):
        pass
