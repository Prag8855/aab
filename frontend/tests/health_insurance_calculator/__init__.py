def get_calculator(page):
    return page.get_by_role("group", name="Health insurance calculator")


def see_options(page):
    page.get_by_role("button", name="See options").click()


def previous_step(page):
    page.get_by_role("button", name="Go back").click()


def load_calculator(page):
    page.goto("/tools/health-insurance-calculator")


def select_occupation(page, occupation):
    page.get_by_role("button", name=occupation).click()


def fill_calculator_until(page, step=None, occupation="Employee"):
    load_calculator(page)
    select_occupation(page, occupation)

    if step == "questions":
        return
