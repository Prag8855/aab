from playwright.sync_api import expect
from utils import fill_anmeldung_form_until, fill_new_address, next_step, previous_step


def test_data_remembered(page):
    fill_anmeldung_form_until(page, 'newAddress')
    fill_new_address(page)
    next_step(page)
    previous_step(page)

    expect(page.get_by_label("Street address")).to_have_value("Pasewalker Straße 65")
    expect(page.get_by_label("Post code")).to_have_value("13127")
    expect(page.get_by_label("Building details")).to_have_value("Haus B, 2. Etage rechts")

    expect(page.get_by_title("Day of the month")).to_have_value("22")
    expect(page.get_by_title("Month", exact=True)).to_have_value("12")
    expect(page.get_by_title("Year")).to_have_value("2023")
