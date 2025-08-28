from playwright.sync_api import expect
from ..test_data import people
from ..abmeldung_form import fill_abmeldung_form_until, fill_old_address, next_step, previous_step
import re


def test_data_remembered(page, assert_snapshot):
    fill_abmeldung_form_until(page, 'oldAddress')
    fill_old_address(page)
    next_step(page)
    previous_step(page)

    address = people[0]['local_address']
    expect(page.get_by_label("Street address")).to_have_value(address['street'])
    expect(page.get_by_label("Post code")).to_have_value(address['post_code'])
    expect(page.get_by_label("Building details")).to_have_value(address['zusatz'])

    year, month, day = people[0]['move_out_date']
    expect(page.get_by_title("Day of the month")).to_have_value(day)
    expect(page.get_by_title("Month", exact=True)).to_have_value(month)
    expect(page.get_by_title("Year")).to_have_value(year)

    assert_snapshot(page)


def test_data_validity_check(page, assert_snapshot):
    fill_abmeldung_form_until(page, 'oldAddress')

    expect(page.locator('.abmeldung-form')).not_to_have_class(re.compile(r'.*show-errors.*'))
    expect(page.get_by_label("Street address")).to_have_js_property('validity.valid', False)
    expect(page.get_by_title("Postal code (Postleitzahl)")).to_have_js_property('validity.valid', False)
    expect(page.get_by_label("Building details")).to_have_js_property('validity.valid', True)

    expect(page.get_by_title("Day of the month")).to_have_js_property('validity.valid', False)
    expect(page.get_by_title("Month", exact=True)).to_have_js_property('validity.valid', False)
    expect(page.get_by_title("Year")).to_have_js_property('validity.valid', False)

    next_step(page)

    expect(page.locator('.abmeldung-form')).to_have_class(re.compile(r'.*show-errors.*'))
    expect(page.get_by_label("Street address")).to_have_js_property('validity.valid', False)
    expect(page.get_by_title("Postal code (Postleitzahl)")).to_have_js_property('validity.valid', False)

    expect(page.get_by_title("Day of the month")).to_have_js_property('validity.valid', False)
    expect(page.get_by_title("Month", exact=True)).to_have_js_property('validity.valid', False)
    expect(page.get_by_title("Year")).to_have_js_property('validity.valid', False)

    assert_snapshot(page)
