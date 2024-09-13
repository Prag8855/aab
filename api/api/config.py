from logtail import LogtailHandler
from pathlib import Path
import logging
import os

log_handlers = [logging.StreamHandler(), ]
if os.environ.get('BETTERSTACK_SOURCE_TOKEN'):
    log_handlers.append(LogtailHandler(source_token=os.environ['BETTERSTACK_SOURCE_TOKEN']))

logging_config = {
    'level': logging.INFO,
    'format': '%(asctime)s %(levelname)s [%(name)s:%(lineno)d] %(message)s',
    'handlers': log_handlers,
}

base_path = Path(__file__).parent.resolve()
backup_dir = Path('/var/db-backups')
db_path = Path('/var/db/api.db')
db_url = f'sqlite:///{str(db_path)}'

message_types = {
    'forms/pension-refund-question': {
        'title': 'Pension refund question from {name} (All About Berlin)',
        'template_path': 'messages/pension-refund-question.html',
        'recipients': ['partner@fundsback.org', ],
        'reply_to_sender': True,
    },
    'forms/pension-refund-germanypensionrefund': {
        'title': 'Pension refund request from {name} (All About Berlin)',
        'template_path': 'messages/pension-refund-form.html',
        'recipients': ['refund@germanypensionrefund.com', ],
        'reply_to_sender': True,
    },
    'forms/pension-refund-pensionrefundgermany': {
        'title': 'Pension refund request from {name} (All About Berlin)',
        'template_path': 'messages/pension-refund-form.html',
        'recipients': ['support@pension-refund.com', ],
        'reply_to_sender': True,
    },
    'forms/pension-refund-fundsback': {
        'title': 'Pension refund request from {name} (All About Berlin)',
        'template_path': 'messages/pension-refund-form.html',
        'recipients': ['partner@fundsback.org', ],
        'reply_to_sender': True,
    },
    'forms/health-insurance-question': {
        'title': 'Health insurance question from {name} (All About Berlin)',
        'template_path': 'messages/health-insurance-question.html',
        'recipients': ['hello@feather-insurance.com', ],
        'reply_to_sender': True,
    },
    'reminders/health-insurance-question-reminder': {
        'title': 'Feather will contact you soon',
        'template_path': 'messages/health-insurance-question-reminder.html',
        'reply_to_sender': False,
    },
    'reminders/tax-id-request-feedback-reminder': {
        'title': 'Did you get your tax ID?',
        'template_path': 'messages/tax-id-request-feedback-reminder.html',
        'reply_to_sender': False,
    },
    'reminders/pension': {
        'title': 'Reminder: you can now get a refund for your German pension payments',
        'template_path': 'messages/pension-reminder.html',
        'reply_to_sender': False,
    },
}
