from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, connection
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


class ReplyToSenderMixin(EmailMixin):
    @property
    def reply_to(self) -> str:
        return self.email

    class Meta:
        abstract = True


class RecipientIsSenderMixin(EmailMixin):
    @property
    def recipients(self) -> list[str]:
        return [self.email, ]

    class Meta:
        abstract = True


class NameMixin(models.Model):
    name = models.CharField(max_length=150)

    def remove_personal_data(self):
        super().remove_personal_data()
        self.name = filler_string

    class Meta:
        abstract = True


class MessageStatus(models.IntegerChoices):
    SCHEDULED = 0, "Scheduled"
    FAILED = 1, "Error"
    SENT = 2, "Sent"
    REDACTED = 3, "Sent and redacted for privacy"


class ResidencePermitTypes(models.TextChoices):
    BLUE_CARD = 'BLUE_CARD', "Blue Card"
    CITIZENSHIP = 'CITIZENSHIP', "Citizenship"
    FAMILY_REUNION_VISA = 'FAMILY_REUNION_VISA', "Family reunion visa"
    FREELANCE_VISA = 'FREELANCE_VISA', "Freelance visa"
    JOB_SEEKER_VISA = 'JOB_SEEKER_VISA', "Job seeker visa"
    PERMANENT_RESIDENCE = 'PERMANENT_RESIDENCE', "Permanent residence"
    STUDENT_VISA = 'STUDENT_VISA', "Student visa"
    WORK_VISA = 'WORK_VISA', "Work visa"


class Departments(models.TextChoices):
    A1_A5 = 'A1_A5', "A1, A5"
    A2_A3_A4 = 'A2_A3_A4', "A2, A3, A4"
    B1_B2_B3_B4 = 'B1_B2_B3_B4', "B1, B2, B3, B4"
    B6 = 'B6', "B6"
    E1 = 'E1', "E1"
    E2 = 'E2', "E2"
    E3 = 'E3', "E3"
    E4 = 'E4', "E4"
    E5 = 'E5', "E5"
    E6 = 'E6', "E6"


class ScheduledMessage(models.Model):
    creation_date = models.DateTimeField(auto_now_add=True)
    delivery_date = models.DateTimeField(default=timezone.now)
    status = models.PositiveSmallIntegerField(choices=MessageStatus, default=MessageStatus.SCHEDULED)

    recipients: List[str] = []
    subject: str = ''
    template: str | None = None
    reply_to: str | None = None

    def save(self, *args, **kwargs):
        if not self.pk:
            logger.info(f'Scheduling 1 message ({self.__class__.__name__})')
            if settings.DEBUG_EMAILS:
                logger.info(
                    "SCHEDULING EMAIL MESSAGE\n"
                    f"Deliver on: {self.delivery_date}\n"
                    f"To: {', '.join(self.recipients)}\n"
                    f"Reply-To: {self.reply_to}\n"
                    f"Subject: {self.subject}\n"
                    f"Body: \n{self.get_body()}"
                )
        super().save(*args, **kwargs)

    def remove_personal_data(self):
        self.status = MessageStatus.REDACTED

    def get_body(self) -> str:
        return render_to_string(self.template, {'message': self})

    class Meta:
        abstract = True
        ordering = ['-creation_date']


class Feedback(EmailMixin, models.Model):
    modification_key = models.CharField(primary_key=True, max_length=32, unique=True, default=random_key)
    creation_date = models.DateTimeField(auto_now_add=True)
    modification_date = models.DateTimeField(auto_now=True)
    email = models.EmailField(validators=[validate_email], blank=True, null=True)

    class Meta:
        abstract = True
        ordering = ['-modification_date']


class HealthInsuranceQuestion(NameMixin, ReplyToSenderMixin, EmailMixin, ScheduledMessage):
    age = models.PositiveSmallIntegerField(null=True)
    income = models.PositiveIntegerField(null=True)
    occupation = models.CharField(max_length=50, blank=True)  # "selfEmployed"
    phone = models.CharField(max_length=30, blank=True)
    question = models.TextField(blank=True)
    is_married = models.BooleanField(null=True)
    children_count = models.PositiveSmallIntegerField(null=True)
    desired_service = models.CharField(max_length=50, blank=True)  # "barmer"

    recipients = ['Seamus.Wolf@horizon65.com', ]
    template = 'health-insurance-question.html'

    def save(self, *args, **kwargs):
        if not self.pk:
            HealthInsuranceQuestionConfirmation.objects.create(email=self.email, name=self.name)
            HealthInsuranceQuestionFeedback.objects.create(email=self.email, name=self.name)
        super().save(*args, **kwargs)

    def remove_personal_data(self):
        super().remove_personal_data()
        self.phone = filler_string

    @property
    def subject(self) -> str:
        return f"Health insurance question from {self.name} (All About Berlin)"

    class Meta(ScheduledMessage.Meta):
        pass


class HealthInsuranceQuestionConfirmation(NameMixin, RecipientIsSenderMixin, EmailMixin, ScheduledMessage):
    subject = 'Seamus will contact you soon'
    template = 'health-insurance-question-confirmation.html'

    class Meta(ScheduledMessage.Meta):
        pass


def in_1_week():
    return timezone.now() + timedelta(weeks=1)


class HealthInsuranceQuestionFeedback(NameMixin, RecipientIsSenderMixin, EmailMixin, ScheduledMessage):
    subject = 'Did Seamus help you get insured?'
    template = 'health-insurance-question-feedback.html'
    delivery_date = models.DateTimeField(default=in_1_week)

    class Meta(ScheduledMessage.Meta):
        pass


class PensionRefundQuestion(NameMixin, ReplyToSenderMixin, EmailMixin, ScheduledMessage):
    nationality = CountryField()
    country_of_residence = CountryField()
    question = models.TextField()

    recipients = ['support@pension-refund.com', ]
    template = 'pension-refund-question.html'

    @property
    def subject(self) -> str:
        return f"Pension refund question from {self.name} (All About Berlin)"

    class Meta(ScheduledMessage.Meta):
        pass


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

    class Meta(ScheduledMessage.Meta):
        pass


class PensionRefundReminder(RecipientIsSenderMixin, EmailMixin, ScheduledMessage):
    refund_amount = models.PositiveIntegerField()

    subject = "Reminder: you can now get your German pension payments back"
    template = 'pension-refund-reminder.html'

    class Meta(ScheduledMessage.Meta):
        pass


def in_8_weeks():
    return timezone.now() + timedelta(weeks=8)


class ResidencePermitFeedbackManager(models.Manager):
    def wait_time(self, date_column_start, date_column_end, residence_permit_type, department):
        residence_permit_type_filter = "AND residence_permit_type=%(residence_permit_type)s" if residence_permit_type else ''
        department_filter = "AND department=%(department)s" if department else ''
        percentiles_query = f"""
            WITH time_diffs AS (
                SELECT
                    CAST( (julianday({date_column_end}) - julianday({date_column_start})) AS INT) AS time_diff
                FROM {self.model._meta.db_table}
                WHERE
                    {date_column_end} IS NOT NULL
                    AND {date_column_start} IS NOT NULL
                    {residence_permit_type_filter}
                    {department_filter}
                ORDER BY time_diff ASC
            ),
            row_count AS (
                SELECT COUNT(*) AS row_count FROM time_diffs
            ),
            percentile_rows AS(
                SELECT
                    CAST(CEIL(row_count * 0.2) AS INT) AS row_20,
                    CAST(FLOOR(row_count * 0.8) AS INT) + 1 AS row_80
                FROM row_count
            ),
            numbered_rows AS (
                SELECT
                    time_diff,
                    row_20,
                    row_80,
                    ROW_NUMBER() over (order by time_diff) as rownum
                FROM time_diffs, percentile_rows
            )
            SELECT
                time_diff,
                row_count,
                AVG(time_diff) OVER () AS average
            FROM numbered_rows, row_count
            WHERE
                rownum >= row_20
                AND rownum <= row_80
        """
        with connection.cursor() as cursor:
            cursor.execute(percentiles_query, {
                'residence_permit_type': residence_permit_type,
                'department': department,
            })
            results = list(zip(*cursor.fetchall()))
        if results and len(results[0]) >= 2:
            percentile_20 = results[0][0]
            percentile_80 = results[0][-1]
            row_count = results[1][0]
            average = results[2][0]
        else:  # No data
            percentile_20 = None
            percentile_80 = None
            row_count = 0
            average = None

        return {
            'percentile_20': percentile_20,
            'percentile_80': percentile_80,
            'count': row_count,
            'average': average,
        }


class ResidencePermitFeedback(Feedback):
    residence_permit_type = models.CharField(choices=ResidencePermitTypes, max_length=30)

    application_date = models.DateField()
    first_response_date = models.DateField(null=True, blank=True)
    appointment_date = models.DateField(null=True, blank=True)
    pick_up_date = models.DateField(null=True, blank=True)

    department = models.CharField(max_length=30, choices=Departments)
    notes = models.TextField(blank=True)

    objects = ResidencePermitFeedbackManager()

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

    class Meta(Feedback.Meta):
        pass


class ResidencePermitFeedbackReminder(RecipientIsSenderMixin, EmailMixin, ScheduledMessage):
    feedback = models.ForeignKey(ResidencePermitFeedback, related_name='feedback_reminders', on_delete=models.CASCADE)

    subject = "Did you get your residence permit?"
    template = 'residence-permit-feedback-reminder.html'

    class Meta(ScheduledMessage.Meta):
        pass


class TaxIdRequestFeedbackReminder(NameMixin, RecipientIsSenderMixin, EmailMixin, ScheduledMessage):
    delivery_date = models.DateTimeField(default=in_8_weeks)

    subject = "Did you receive your tax ID?"
    template = 'tax-id-request-feedback-reminder.html'

    class Meta(ScheduledMessage.Meta):
        pass


scheduled_message_models = [
    HealthInsuranceQuestion,
    HealthInsuranceQuestionConfirmation,
    HealthInsuranceQuestionFeedback,
    PensionRefundQuestion,
    PensionRefundRequest,
    PensionRefundReminder,
    ResidencePermitFeedbackReminder,
    TaxIdRequestFeedbackReminder,
]
