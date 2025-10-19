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


def fill_calculator_until(
    page,
    step=None,
    occupation: str = "employee",
    preset_occupation: bool = False,
):
    load_calculator(page, occupation if preset_occupation else None)

    if step == "occupation":
        return

    select_occupation(page, occupation)

    if step == "questions":
        return
