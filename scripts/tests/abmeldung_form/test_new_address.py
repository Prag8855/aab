from playwright.sync_api import expect
from ..test_data import people
from ..abmeldung_form import fill_abmeldung_form_until, fill_new_address, next_step, previous_step
import re


def test_data_remembered(page):
    fill_abmeldung_form_until(page, 'newAddress')
    fill_new_address(page)
    next_step(page)
    previous_step(page)

    address = people[0]['foreign_address']
    expect(page.get_by_label("Street address")).to_have_value(address['street'])
    expect(page.get_by_label("City and post code")).to_have_value(address['city'])
    expect(page.get_by_label("Country")).to_have_value(address['country_code'])


def test_data_validity_check(page):
    fill_abmeldung_form_until(page, 'newAddress')

    expect(page.locator('.abmeldung-form')).not_to_have_class(re.compile(r'.*show-errors.*'))
    expect(page.get_by_label("Street address")).to_have_js_property('validity.valid', False)
    expect(page.get_by_label("City and post code")).to_have_js_property('validity.valid', False)
    expect(page.get_by_label("Country")).to_have_js_property('validity.valid', False)

    next_step(page)

    expect(page.locator('.abmeldung-form')).to_have_class(re.compile(r'.*show-errors.*'))
    expect(page.get_by_label("Street address")).to_have_js_property('validity.valid', False)
    expect(page.get_by_label("City and post code")).to_have_js_property('validity.valid', False)
    expect(page.get_by_label("Country")).to_have_js_property('validity.valid', False)


def test_data_germany(page):
    fill_abmeldung_form_until(page, 'newAddress')

    address = people[0]['foreign_address']
    page.get_by_label("Street address").fill(address['street'])
    page.get_by_label("City and post code").fill(address['city'])
    page.get_by_label("Country").select_option("Germany")
    expect(page.locator('.input-instructions')).to_have_text(
        re.compile("^If you stay in Germany, you probably don't need to deregister your address.*")
    )

    next_step(page)

    expect(page.locator('.abmeldung-form')).to_have_class(re.compile(r'.*show-errors.*'))
