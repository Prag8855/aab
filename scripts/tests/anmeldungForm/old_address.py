from playwright.sync_api import expect
from utils import fill_anmeldung_form_until, fill_old_address, next_step, previous_step


def test_data_remembered(page):
    fill_anmeldung_form_until(page, 'oldAddress')
    fill_old_address(page)
    next_step(page)
    previous_step(page)

    expect(page.get_by_label("Country")).to_have_value("Germany")
    expect(page.get_by_label("Street address")).to_have_value("Chausseestraße 108")
    expect(page.get_by_placeholder("12345")).to_have_value("10115")
    expect(page.get_by_placeholder("Berlin")).to_have_value("Berlin")
    expect(page.get_by_label("Building details")).to_have_value("#1.5.6")
    expect(page.get_by_label("State")).to_have_value("be")
