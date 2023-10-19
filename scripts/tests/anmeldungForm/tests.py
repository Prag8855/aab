from utils import fill_anmeldung_form_until


def test_base_flow(page):
    fill_anmeldung_form_until(page)


def test_base_flow_multiple_people(page):
    fill_anmeldung_form_until(page, multiple_people=True)
