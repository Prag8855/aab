from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import connection
from forms.models import HealthInsuranceQuestion, PensionRefundQuestion, PensionRefundReminder, PensionRefundRequest, \
    ResidencePermitFeedback, TaxIdRequestFeedbackReminder
from forms.serializers import HealthInsuranceQuestionSerializer, \
    PensionRefundQuestionSerializer, PensionRefundReminderSerializer, PensionRefundRequestSerializer, \
    PublicResidencePermitFeedbackSerializer, ResidencePermitFeedbackSerializer, TaxIdRequestFeedbackReminderSerializer
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.serializers import as_serializer_error
from rest_framework.views import exception_handler as drf_exception_handler


class MessagePermission(permissions.BasePermission):
    """
    Messages can be posted anonymously, but only read by admins
    """

    def has_permission(self, request, view):
        if request.method in ('POST', 'PUT'):
            return True
        elif request.method == 'GET':
            return request.user and request.user.is_superuser
        return False


class MessageViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    http_method_names = ['get', 'post']
    permission_classes = [MessagePermission]


class FeedbackViewSet(mixins.UpdateModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    http_method_names = ['get', 'post', 'put']


class HealthInsuranceQuestionViewSet(MessageViewSet):
    queryset = HealthInsuranceQuestion.objects.all()
    serializer_class = HealthInsuranceQuestionSerializer


class PensionRefundQuestionViewSet(MessageViewSet):
    queryset = PensionRefundQuestion.objects.all()
    serializer_class = PensionRefundQuestionSerializer


class PensionRefundReminderViewSet(MessageViewSet):
    queryset = PensionRefundReminder.objects.all()
    serializer_class = PensionRefundReminderSerializer


class PensionRefundRequestViewSet(MessageViewSet):
    queryset = PensionRefundRequest.objects.all()
    serializer_class = PensionRefundRequestSerializer


class ResidencePermitFeedbackViewSet(FeedbackViewSet):
    queryset = ResidencePermitFeedback.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'GET' and not self.request.user.is_authenticated:
            return PublicResidencePermitFeedbackSerializer
        return ResidencePermitFeedbackSerializer

    def get_queryset(self):
        """
        Optionally restricts the returned purchases to a given user,
        by filtering against a `username` query parameter in the URL.
        """
        params = ['residence_permit_type', 'department']
        filters = {
            param: self.request.query_params[param]
            for param in params
            if param in self.request.query_params
        }
        return self.queryset.filter(**filters)

    @action(detail=False, methods=['get'])
    def summary(self, request, format=None):
        def get_date_range(cursor, date_column_start, date_column_end, residence_permit_type, department):
            residence_permit_type_filter = "AND residence_permit_type=%(residence_permit_type)s" if residence_permit_type else ''
            department_filter = "AND department=%(department)s" if department else ''
            percentiles_query = f"""
                WITH time_diffs AS (
                    SELECT
                        CAST( (julianday({date_column_end}) - julianday({date_column_start})) AS INT) AS time_diff
                    FROM forms_residencepermitfeedback
                    WHERE
                        {date_column_end} IS NOT NULL
                        AND {date_column_start} IS NOT NULL
                        {residence_permit_type_filter}
                        {department_filter}
                    ORDER BY time_diff ASC
                ),
                total_rows AS (
                    SELECT COUNT(*) AS total_rows FROM time_diffs
                ),
                percentile_rows AS(
                    SELECT
                        CAST((total_rows * 0.2) AS INT) AS row_20,
                        CAST((total_rows * 0.8) AS INT) AS row_80
                    FROM total_rows
                ),
                numbered_rows AS (
                    SELECT
                        time_diff,
                        row_20,
                        row_80,
                        ROW_NUMBER() over (order by time_diff) as rownum
                    FROM time_diffs, percentile_rows
                )
                SELECT time_diff
                FROM numbered_rows
                WHERE rownum IN (row_20, row_80)
            """
            cursor.execute(percentiles_query, {
                'residence_permit_type': residence_permit_type,
                'department': department,
            })
            percentile_20, percentile_80 = [row[0] for row in cursor.fetchall()]
            return percentile_20, percentile_80

        with connection.cursor() as cursor:
            residence_permit_type = self.request.query_params.get('residence_permit_type')
            department = self.request.query_params.get('department')
            response_data = {
                'steps': {
                    'response_range': get_date_range(
                        cursor,
                        'application_date', 'first_response_date',
                        residence_permit_type, department
                    ),
                    'appointment_range': get_date_range(
                        cursor,
                        'first_response_date', 'appointment_date',
                        residence_permit_type, department
                    ),
                    'pick_up_range': get_date_range(
                        cursor,
                        'appointment_date', 'pick_up_date',
                        residence_permit_type, department
                    ),
                },
            }
        return Response(response_data, status=200)


class TaxIdRequestFeedbackReminderViewSet(MessageViewSet):
    queryset = TaxIdRequestFeedbackReminder.objects.all()
    serializer_class = TaxIdRequestFeedbackReminderSerializer


def exception_handler(exc, context):
    """
    Handle ValidationErrors properly so that they return a 400 instead of a 500
    """
    if isinstance(exc, DjangoValidationError):
        exc = DRFValidationError(as_serializer_error(exc))

    return drf_exception_handler(exc, context)
