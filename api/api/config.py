from pathlib import Path
import logging

db_url = 'sqlite:////var/db/api.db'

base_path = Path(__file__).parent.resolve()

logging_config = {
    'datefmt': '%Y-%m-%d %H:%M:%S',
    'format': '%(asctime)s %(levelname)s [%(name)s:%(lineno)d] %(message)s',
    'level': logging.INFO,
}

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
    'reminders/pension': {
        'title': 'Reminder: you can now get a refund for your German pension payments',
        'template_path': 'messages/pension-reminder.html',
        'reply_to_sender': False,
    },
}
