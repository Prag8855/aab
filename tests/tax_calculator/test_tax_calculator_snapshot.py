from . import fill_calculator


def test_snapshot(page, test_screenshot):
    page.goto("/tests/component/tax-calculator")
    calculator = page.get_by_role("group", name="German tax calculator")
    test_screenshot(page, calculator)
    page.get_by_role("link", name="Show options").click()
    fill_calculator(page)
    test_screenshot(page, calculator)
