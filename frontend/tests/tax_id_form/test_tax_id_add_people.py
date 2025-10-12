from playwright.sync_api import expect
from ..test_data import people
from ..tax_id_form import fill_tax_id_form_until, fill_people, next_step, previous_step, get_form


def test_data_remembered(page, assert_snapshot):
    fill_tax_id_form_until(page, "addPeople")
    fill_people(page, multiple_people=True)

    next_step(page)
    previous_step(page)

    for index in range(0, 5):
        person = people[index]
        expect(page.get_by_title("First name").nth(index)).to_have_value(person["first_name"])
        expect(page.get_by_title("Last name").nth(index)).to_have_value(person["last_name"])

        expect(page.get_by_label("Name at birth").nth(index)).to_have_value(person["birth_name"])

        expect(page.get_by_label("Place of birth").nth(index)).to_have_value(person["birth_place"])

        year, month, day = person["birth_date"]
        expect(page.get_by_title("Day of the month").nth(index)).to_have_value(day)
        expect(page.get_by_title("Month", exact=True).nth(index)).to_have_value(month)
        expect(page.get_by_title("Year").nth(index)).to_have_value(year)

    assert_snapshot(get_form(page).screenshot())
