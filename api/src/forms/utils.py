from email_validator import validate_email, EmailNotValidError


def email_is_valid(email: str) -> bool:
    try:
        validate_email(email, check_deliverability=True)
    except EmailNotValidError:
        return False
    else:
        return True
