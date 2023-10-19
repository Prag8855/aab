from playwright.sync_api import expect
from utils import fill_anmeldung_form_until, fill_people, next_step, previous_step


def test_data_remembered(page):
    fill_anmeldung_form_until(page, 'addPeople')
    fill_people(page, multiple_people=True)

    next_step(page)
    previous_step(page)

    for index in range(0, 4):
        expect(page.get_by_label("Title").nth(index)).to_have_value("Dr.")
        expect(page.get_by_label("Name at birth").nth(index)).to_have_value("Nicole Bouliane")

        expect(page.get_by_text("Male", exact=True).nth(index)).to_be_checked()

        expect(page.get_by_label("Place of birth").nth(index)).to_have_value("Kadıköy, Istanbul, Turkey")
        expect(page.get_by_label("Nationality").nth(index)).to_have_value("Türkiye")
        expect(page.get_by_label("Religion").nth(index)).to_have_value("Sonstiges, nicht kirchensteuerpflichtig")

        expect(page.get_by_title("Day of the month").nth(index)).to_have_value("25")
        expect(page.get_by_title("Month", exact=True).nth(index)).to_have_value("09")
        expect(page.get_by_title("Year").nth(index)).to_have_value("1990")
