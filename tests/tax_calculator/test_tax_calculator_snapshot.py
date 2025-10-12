from . import fill_calculator


def test_snapshot(page, assert_snapshot):
    page.goto("/tests/component/tax-calculator")
    calculator = page.get_by_role("group", name="German tax calculator")
    assert_snapshot(calculator.screenshot())
    page.get_by_role("link", name="Show options").click()
    fill_calculator(page)
    assert_snapshot(calculator.screenshot())
