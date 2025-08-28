from . import fill_calculator


def test_snapshot(page, assert_snapshot):
    page.goto("/tools/tax-calculator")
    assert_snapshot(page)
    page.get_by_role("link", name="Show options").click()
    fill_calculator(page)
    assert_snapshot(page)
