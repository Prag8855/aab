occupations = [
    "studentUnemployed",
    "employee",
    "selfEmployed",
    "azubi",
    "unemployed",
    "other",
]


def get_calculator(page):
    return page.get_by_role("group", name="Health insurance calculator")


def see_options(page):
    page.get_by_role("button", name="See options").click()


def previous_step(page):
    page.get_by_role("button", name="Go back").click()


def load_calculator(page, preset_occupation: str | None = None):
    page.goto(
        f"/tests/component/health-insurance-calculator-{preset_occupation}"
        if preset_occupation
        else "/tests/component/health-insurance-calculator"
    )


def select_occupation(page, occupation: str):
    page.locator(f"button[data-occupation={occupation}]").click()


def fill_questions(
    page,
    income,
    age,
    is_married,
    children_count,
    is_applying_for_first_visa,
    has_eu_public_insurance,
    has_german_public_insurance,
):
    page.get_by_label("Income").fill(str(income))
    page.get_by_label("Age", exact=True).fill(str(age))
    if is_married:
        page.get_by_label("Married", exact=True).evaluate("el => el.checked = true")
    else:
        page.get_by_label("Not married", exact=True).evaluate("el => el.checked = true")
    page.get_by_label("Children").select_option(str(children_count))
    page.get_by_label("I am applying for").set_checked(is_applying_for_first_visa)
    page.get_by_label("I have public health insurance in another EU country").set_checked(has_eu_public_insurance)
    page.get_by_label("I have public health insurance in Germany").set_checked(has_german_public_insurance)


def fill_calculator_until(page, step=None, preset_occupation: bool = False, **case):
    load_calculator(page, case["occupation"] if preset_occupation else None)

    if step == "occupation":
        return

    select_occupation(page, case.pop("occupation"))

    if step == "questions":
        return

    fill_questions(page, **case)
    see_options(page)

    if step == "options":
        return
