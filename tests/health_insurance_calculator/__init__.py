occupations = [
    "azubi",
    "employee",
    "other",
    "selfEmployed",
    "studentUnemployed",
    "unemployed",
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
    if occupation.startswith("student"):
        page.locator("button[data-occupation=studentUnemployed]").click()
    else:
        page.locator(f"button[data-occupation={occupation}]").click()


def fill_questions(
    page,
    occupation,
    income: int | None = None,
    age: int | None = None,
    is_married: bool | None = None,
    children_count: int | None = None,
    is_applying_for_first_visa: bool | None = None,
    has_eu_public_insurance: bool | None = None,
    has_german_public_insurance: bool | None = None,
):
    if age is not None:
        page.get_by_label("Age", exact=True).fill(str(age))

    if is_married is not None:
        if is_married:
            page.get_by_label("Married", exact=True).evaluate("el => el.checked = true")
        else:
            page.get_by_label("Not married", exact=True).evaluate("el => el.checked = true")

    if children_count is not None:
        page.get_by_label("Children").select_option(str(children_count))

    if is_applying_for_first_visa is not None:
        page.get_by_label("I am applying for").set_checked(is_applying_for_first_visa)

    if has_eu_public_insurance is not None:
        page.get_by_label("I have public health insurance in another EU country").set_checked(has_eu_public_insurance)

    if has_german_public_insurance is not None:
        page.get_by_label("I have public health insurance in Germany").set_checked(has_german_public_insurance)

    if income is not None:
        if occupation == "studentEmployee":
            page.get_by_label("I have a job").check()
        elif occupation == "studentSelfEmployed":
            page.get_by_label("I am self-employed").check()

        if occupation == "employee":
            page.get_by_label("Salary").fill(str(income))
        elif occupation == "studentUnemployed":
            pass  # No income
        else:
            page.get_by_label("Income").fill(str(income))


def assert_stage(page, expected_stage: str):
    stage = get_calculator(page).get_attribute("data-stage")
    assert stage == expected_stage, f"Expected stage '{expected_stage}', got '{stage}'"


def fill_calculator_until(page, step=None, preset_occupation: bool = False, **case):
    load_calculator(page, case["occupation"] if preset_occupation else None)
    assert_stage(page, "occupation")

    if step == "occupation":
        return

    select_occupation(page, case["occupation"])
    assert_stage(page, "questions")

    if step == "questions":
        return

    fill_questions(page, **case)
    see_options(page)

    assert_stage(page, "options")

    if step == "options":
        return
