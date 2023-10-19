from playwright.sync_api import expect


def next_step(page):
    page.get_by_role("button", name="Continue").click()


def previous_step(page):
    page.get_by_role("button", name="Go back").click()


def load_anmeldung_form(page):
    page.goto("/docs/anmeldung")


def start_anmeldung(page):
    page.get_by_role("button", name="Start").click()


def fill_new_address(page):
    page.get_by_label("Street address").fill("Pasewalker Straße 65")
    page.get_by_label("Post code").fill("13127")
    page.get_by_label("Building details").fill("Haus B, 2. Etage rechts")

    page.get_by_title("Day of the month").fill("22")
    page.get_by_title("Month", exact=True).fill("12")
    page.get_by_title("Year").fill("2023")


def fill_old_address(page):
    page.get_by_label("Country").select_option("Germany")
    page.get_by_label("Street address").fill("Chausseestraße 108")
    page.get_by_placeholder("12345").fill("10115")
    page.get_by_placeholder("Berlin").fill("Berlin")
    page.get_by_label("Building details").fill("#1.5.6")
    page.get_by_label("State").select_option("Berlin")


def add_person(page):
    page.get_by_role("button", name="Add another person").click()


def fill_person(page, index=0):
    page.get_by_placeholder("Alex", exact=True).nth(index).fill("Bjørn")
    page.get_by_placeholder("Smith", exact=True).nth(index).fill("O'Reilly")

    # Note: this link disappears after clicking, so we can't select by index
    page.get_by_role("link", name="Add a title or birth name").nth(0).click()
    page.get_by_label("Title").nth(index).fill("Dr.")
    page.get_by_label("Name at birth").nth(index).fill("Nicole Bouliane")

    page.get_by_text("Male", exact=True).nth(index).click()

    page.get_by_title("Day of the month").nth(index).fill("25")
    page.get_by_title("Month", exact=True).nth(index).fill("9")
    page.get_by_title("Year").nth(index).fill("1990")

    page.get_by_label("Place of birth").nth(index).fill("Kadıköy, Istanbul, Turkey")
    page.get_by_label("Nationality").nth(index).fill("Türkiye")
    page.get_by_label("Religion").nth(index).select_option("Sonstiges, nicht kirchensteuerpflichtig")


def fill_people(page, multiple_people=False):
    fill_person(page)
    if multiple_people:
        for index in range(1, 4):
            add_person(page)
            fill_person(page, index)


def fill_bei_address(page, multiple_people=False):
    if multiple_people:
        control = page.get_by_label('Our names are on our mailbox')
    else:
        control = page.get_by_label('My name is on my mailbox')

    expect(control).to_be_checked()
    control.set_checked(False)
    page.get_by_label('Name on mailbox').fill("Müller")


def fill_documents(page, multiple_people=False):
    for index in range(0, 4 if multiple_people else 1):
        page.get_by_label('Passport', exact=True).nth(index).set_checked(True)
        page.get_by_label('Passport number').nth(index).fill("AB1234567")

        page.get_by_title("Day of the month").nth(index * 2).fill("20")
        page.get_by_title("Month", exact=True).nth(index * 2).fill("10")
        page.get_by_title("Year").nth(index * 2).fill("2020")

        page.get_by_label('Issuing authority').nth(index).fill("Berlin")

        page.get_by_title("Day of the month").nth(index * 2 + 1).fill("30")
        page.get_by_title("Month", exact=True).nth(index * 2 + 1).fill("10")
        page.get_by_title("Year").nth(index * 2 + 1).fill("2025")


def fill_anmeldung_form_until(page, step=None, multiple_people=False):
    load_anmeldung_form(page)
    start_anmeldung(page)

    if step == 'newAddress':
        return

    fill_new_address(page)
    next_step(page)

    if step == 'oldAddress':
        return

    fill_old_address(page)
    next_step(page)

    if step == 'addPeople':
        return

    fill_people(page, multiple_people)
    next_step(page)

    if step == 'beiAddress':
        return

    fill_bei_address(page, multiple_people)
    next_step(page)

    if step == 'idDocuments':
        return

    fill_documents(page, multiple_people)
    page.get_by_role("button", name="Finish").click()
