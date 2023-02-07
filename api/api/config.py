import logging
import os

db_url = 'sqlite:////var/db/api.db'

base_path = os.path.dirname(os.path.abspath(__file__))

logging_config = {
    'datefmt': '%Y-%m-%d %H:%M:%S',
    'format': '[%(asctime)s] %(levelname)s [%(name)s.%(funcName)s:%(lineno)d] %(message)s',
    'level': logging.INFO,
}

message_types = {
    'reminders/pension': {
        'title': 'Reminder: you can now get a refund for your German pension payments',
        'template_path': 'messages/pension-reminder.html'
    },
    'forms/pension-refund-question': {
        'title': 'Pension refund question from {name} (All About Berlin)',
        'template_path': 'messages/pension-refund-question.html',
        'recipients': ['contact@allaboutberlin.com', 'christian.haas@fundsback.org'],
    },
    'forms/pension-refund-germanypensionrefund': {
        'title': 'Pension refund request from {name} (All About Berlin)',
        'template_path': 'messages/pension-refund-form.html',
        'recipients': ['contact@allaboutberlin.com', 'refund@germanypensionrefund.com'],
    },
    'forms/pension-refund-pensionrefundgermany': {
        'title': 'Pension refund request from {name} (All About Berlin)',
        'template_path': 'messages/pension-refund-form.html',
        'recipients': ['contact@allaboutberlin.com', 'support@pension-refund.com'],
    },
    'forms/pension-refund-fundsback': {
        'title': 'Pension refund request from {name} (All About Berlin)',
        'template_path': 'messages/pension-refund-form.html',
        'recipients': ['contact@allaboutberlin.com', 'christian.haas@fundsback.org'],
    },
    'forms/health-insurance-question': {
        'title': 'Health insurance question from {name} (All About Berlin)',
        'template_path': 'messages/health-insurance-question.html',
        'recipients': ['contact@allaboutberlin.com', 'info@bprotected.de'],
    },
    'reminders/health-insurance-question-reminder': {
        'title': 'Daniel will contact you soon',
        'template_path': 'messages/health-insurance-question-reminder.html'
    },
}
