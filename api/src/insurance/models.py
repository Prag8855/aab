from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django_countries.fields import CountryField
from forms.models import ScheduledMessage


class Status(models.TextChoices):
    NEW = "NEW", "New"
    IN_PROGRESS = "IN_PROGRESS", "In consultation"
    WAITING_CLIENT = "WAITING_CLIENT", "Waiting for client"
    WAITING_INSURER = "WAITING_INSURER", "Waiting for insurer"
    ACCEPTED = "ACCEPTED", "Accepted by insurer"
    REJECTED = "REJECTED", "Rejected"
    RESOLVED = "RESOLVED", "Other solution found"
    STALE = "STALE", "Stale"


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


class Case(models.Model):
    """
    A need that usually results in an insurance policy being signed.
    """
    email = models.EmailField()
    phone = models.CharField(blank=True, max_length=50)
    whatsapp = models.CharField(blank=True, max_length=50)
    contact_method = models.CharField("Contact method", max_length=15, choices=ContactMethod, default=ContactMethod.EMAIL)

    creation_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField("Initial notes", blank=True, help_text="For future notes, add Updates to the Case.")
    referrer = models.CharField(blank=True, help_text="Part of the commissions will be paid out to that referrer")

    # Denormalized field to speed up filtering
    status = models.CharField(blank=False, default=Status.NEW, max_length=20, choices=Status, editable=False)

    @property
    def name(self):
        first_person = self.insured_persons.first()
        return first_person.name if first_person else "(no name)"

    def save(self, *args, **kwargs):
        # Get status from child comments
        if self.id:
            if first_comment := self.comments.order_by('-creation_date').first():
                self.status = first_comment.status
            else:
                self.status = Status.NEW
        super().save(*args, **kwargs)

        # Schedule email notifications
        CustomerNotification.objects.get_or_create(case=self)
        BrokerNotification.objects.get_or_create(case=self)
        FeedbackNotification.objects.get_or_create(case=self)

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

    class Meta:
        ordering = ['-creation_date']

    def __str__(self):
        return f"{self.name} — {self.title}"


class Comment(models.Model):
    """
    A generic note/comment added to a person or case
    """
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="comments", related_query_name="comment")

    creation_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    file = models.FileField("Attachment", upload_to='attachments/', blank=True)
    status = models.CharField(max_length=20, choices=Status, blank=True)

    class Meta:
        verbose_name = "Update"
        ordering = ['-creation_date']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.case.status = self.case.comments.order_by('-creation_date').first().status
        self.case.save()

    def clean(self):
        super().clean()
        if not self.notes and not self.file and not self.status:
            raise ValidationError("An update needs notes, a file, or a status change")

    def __str__(self):
        date = self.creation_date.strftime('%Y-%m-%d at %H:%M')
        if self.status:
            return f"{date} — Status → {self.get_status_display()}"
        if self.notes:
            return f"{date} — Added notes"
        if self.file:
            return f"{date} — Attached {self.file.filename}"


class InsuredPerson(models.Model):
    """
    A person that is added to an insurance policy.
    """
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="insured_persons", related_query_name="insured_person")

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(blank=True, max_length=100)
    description = models.CharField(blank=True, max_length=250, help_text="For example \"Spouse\"")

    occupation = models.CharField(max_length=50, choices=Occupation, default=Occupation.OTHER)  # "selfEmployed"
    income = models.PositiveIntegerField("Yearly income", blank=True, null=True)
    nationality = CountryField(blank=True)
    country_of_residence = CountryField(blank=True)
    is_married = models.BooleanField(null=True)

    # Age is easier to collect. Date of birth is necessary at later stages.
    age = models.PositiveSmallIntegerField(blank=True, null=True, help_text="When the date of birth is set, the age is calculated automatically.")
    date_of_birth = models.DateField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.date_of_birth:
            self.age = relativedelta(date.today(), self.date_of_birth).years
        super().save(*args, **kwargs)

    @property
    def name(self):
        return " ".join(filter(bool, [self.first_name, self.last_name]))

    class Meta:
        verbose_name = "Insured person"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


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
    notes = models.TextField(blank=True)

    date_start = models.DateField(help_text="When the policy begins")
    date_end = models.DateField(blank=True, null=True, help_text="When the policy ends, if applicable")

    commission_amount = models.DecimalField('Total commission amount', max_digits=10, decimal_places=2)
    commission_received_date = models.DateField('Insurer commission paid on', blank=True, null=True)

    class Meta:
        verbose_name = "Outcome"


def in_1_week():
    return timezone.now() + timedelta(weeks=1)


class CaseNotificationMixin(ScheduledMessage):
    case = models.ForeignKey(Case, on_delete=models.CASCADE)

    class Meta:
        abstract = True


class CustomerNotification(CaseNotificationMixin, ScheduledMessage):
    subject = 'Seamus will contact you soon'
    template = 'customer-notification.html'

    @property
    def recipients(self) -> list[str]:
        return [self.case.email, ]

    class Meta(ScheduledMessage.Meta):
        pass


class BrokerNotification(CaseNotificationMixin, ScheduledMessage):
    recipients = ['Seamus.Wolf@horizon65.com', ]
    template = 'broker-notification.html'

    @property
    def subject(self) -> str:
        return f"Insurance question from {self.case.name} (All About Berlin)"

    class Meta(ScheduledMessage.Meta):
        pass


class FeedbackNotification(CaseNotificationMixin):
    subject = 'Did Seamus help you get insured?'
    template = 'feedback-notification.html'
    delivery_date = models.DateTimeField(default=in_1_week)

    @property
    def recipients(self) -> list[str]:
        return [self.case.email, ]

    class Meta(ScheduledMessage.Meta):
        pass
