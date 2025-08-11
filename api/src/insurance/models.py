from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django_countries.fields import CountryField
from django.db import models
from django.db.models.functions import Coalesce
from django.db.models import OuterRef, Subquery, Value
from phonenumber_field.modelfields import PhoneNumberField


STATUS_CHOICES = [
    ("new", "New"),
    ("in_progress", "In consultation"),
    ("waiting_client", "Waiting for client"),
    ("waiting_insurer", "Waiting for insurer"),
    ("accepted", "Accepted by insurer"),
    ("rejected", "Rejected"),
    ("resolved", "Generic solution offered"),
    ("stale", "Abandoned"),
]

STATUS_CHOICES_DICT = dict(STATUS_CHOICES)


class Comment(models.Model):
    """
    A generic note/comment added to a person or case
    """
    date_created = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True)
    file = models.FileField("Attachment", upload_to='attachments/', blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, blank=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        verbose_name = "Update"
        ordering = ['-date_created']

    def clean(self):
        super().clean()
        if not self.comment and not self.file and not self.status:
            raise ValidationError("An update needs a file, a comment or a status change")

    def __str__(self):
        value = ""
        if self.file:
            value = f"Attachment {self.file.filename}"
        elif self.comment:
            value = "Comment"

        if value:
            value = f"{value} (Status → {self.get_status_display()})"
        else:
            value = f"Status → {self.get_status_display()}"
        return f"{self.date_created.strftime('%Y-%m-%d at %H:%M')} — {value}"


class CaseManager(models.Manager):
    """
    Annotate each Case with its status, taken from the latest status update.
    """

    def get_queryset(self):
        content_type = ContentType.objects.get_for_model(Case)

        latest_update = Comment.objects.filter(
            content_type=content_type,
            object_id=OuterRef('pk'),
            status__gt=''  # Non-empty status updates
        ).order_by('-date_created')

        return super().get_queryset().annotate(
            latest_status=Coalesce(
                Subquery(latest_update.values('status')[:1]),
                Value('new')
            )
        )


class Case(models.Model):
    """
    A need that usually results in an insurance policy being signed.
    """
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = PhoneNumberField(blank=True)
    whatsapp = PhoneNumberField(blank=True)

    date_created = models.DateTimeField(auto_now_add=True)
    title = models.CharField(blank=True, max_length=150, help_text="For example, \"health insurance for a Blue Card\"")
    notes = models.TextField("Initial notes", blank=True, help_text="For future notes, add Updates to the Case.")
    referrer = models.CharField(blank=True, help_text="Part of the commissions will be paid out to that referrer")

    comments = GenericRelation(Comment)

    objects = CaseManager()

    @property
    def status(self):
        return self.latest_status or 'new'

    def get_status_display(self):
        return STATUS_CHOICES_DICT[self.status]

    get_status_display.short_description = "Status"
    get_status_display.admin_order_field = 'latest_status'

    def __str__(self):
        return f"{self.title} ({self.name})"


class InsuredPerson(models.Model):
    """
    A person that is added to an insurance policy.
    """
    case = models.ForeignKey(Case, on_delete=models.CASCADE)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    description = models.CharField(blank=True, max_length=250, help_text="For example \"Spouse\"")

    occupation = models.CharField(blank=True, max_length=50)  # "selfEmployed"
    nationality = CountryField(blank=True)
    country_of_residence = CountryField(blank=True)

    # Age is easier to collect. Date of birth is necessary at later stages.
    age = models.PositiveSmallIntegerField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)

    comments = GenericRelation(Comment)

    class Meta:
        ordering = ['first_name', 'last_name']
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
