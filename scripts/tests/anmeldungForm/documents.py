from playwright.sync_api import expect
from utils import fill_anmeldung_form_until, fill_people, fill_bei_address, fill_documents, previous_step, \
    next_step


def test_data_remembered(page):
    fill_anmeldung_form_until(page, 'addPeople')

    fill_people(page, multiple_people=True)
    next_step(page)

    fill_bei_address(page, multiple_people=True)
    next_step(page)

    fill_documents(page, multiple_people=True)

    page.get_by_role("button", name="Finish").click()
    previous_step(page)

    for index in range(0, 4):
        expect(page.get_by_label('Passport', exact=True).nth(index)).to_be_checked()
        expect(page.get_by_label('Passport number', exact=True).nth(index)).to_have_value("AB1234567")

        expect(page.get_by_title("Day of the month").nth(index * 2)).to_have_value("20")
        expect(page.get_by_title("Month", exact=True).nth(index * 2)).to_have_value("10")
        expect(page.get_by_title("Year").nth(index * 2)).to_have_value("2020")

        expect(page.get_by_label('Issuing authority').nth(index)).to_have_value("Berlin")

        expect(page.get_by_title("Day of the month").nth(index * 2 + 1)).to_have_value("30")
        expect(page.get_by_title("Month", exact=True).nth(index * 2 + 1)).to_have_value("10")
        expect(page.get_by_title("Year").nth(index * 2 + 1)).to_have_value("2025")
