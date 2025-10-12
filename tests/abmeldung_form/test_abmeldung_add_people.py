from playwright.sync_api import expect
from ..test_data import people
from ..abmeldung_form import fill_abmeldung_form_until, fill_people, previous_step


def test_data_remembered(page, assert_snapshot):
    fill_abmeldung_form_until(page, "addPeople")
    fill_people(page, multiple_people=True)

    page.get_by_role("button", name="Finish").click()
    previous_step(page)

    for index in range(0, 5):
        person = people[index]
        expect(page.get_by_title("First name").nth(index)).to_have_value(person["first_name"])
        expect(page.get_by_title("Last name").nth(index)).to_have_value(person["last_name"])

        expect(page.get_by_label("Title").nth(index)).to_have_value(person["title"])
        expect(page.get_by_label("Name at birth").nth(index)).to_have_value(person["birth_name"])

        expect(page.get_by_text(person["gender"], exact=True).nth(index)).to_be_checked()

        expect(page.get_by_label("Place of birth").nth(index)).to_have_value(person["birth_place"])
        expect(page.get_by_label("Nationality").nth(index)).to_have_value(person["nationality_code"])
        expect(page.get_by_label("Religion").nth(index)).to_have_value(person["religion"][1])

        year, month, day = person["birth_date"]
        expect(page.get_by_title("Day of the month").nth(index)).to_have_value(day)
        expect(page.get_by_title("Month", exact=True).nth(index)).to_have_value(month)
        expect(page.get_by_title("Year").nth(index)).to_have_value(year)

    form = page.get_by_role("group", name="Tool to fill the Abmeldung form")
    assert_snapshot(form.screenshot())
