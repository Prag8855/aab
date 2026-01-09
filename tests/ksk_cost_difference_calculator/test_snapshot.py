import pytest


@pytest.fixture
def ksk_cost_difference_calculator(page):
    page.goto("/tests/component/ksk-cost-difference-calculator")
    return page.get_by_role("group", name="KSK cost calculator")


def test_snapshot(page, ksk_cost_difference_calculator, test_screenshot):
    test_screenshot(page, ksk_cost_difference_calculator)
