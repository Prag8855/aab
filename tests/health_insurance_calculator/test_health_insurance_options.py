from playwright.sync_api import expect
from tests.health_insurance_calculator import cases, assert_stage, fill_calculator_until, get_calculator
import pytest


@pytest.mark.parametrize("case", cases.values(), ids=cases.keys())
def test_options(page, assert_snapshot, case):
    fill_calculator_until(page, "options", **case)
    assert_snapshot(get_calculator(page).screenshot())

    page.get_by_label("Go back").click()
    assert_stage(page, "questions")


@pytest.mark.parametrize("case", cases.values(), ids=cases.keys())
def test_option_ask_a_broker(page, case):
    fill_calculator_until(page, "options", **case)
    page.get_by_label("Ask our expert", exact=True).click()
    assert_stage(page, "askABroker")

    page.click("text=WhatsApp")
    page.get_by_label("Go back").click()
    assert_stage(page, "options")


@pytest.mark.parametrize("case", cases.values(), ids=cases.keys())
def test_option_private_quote(page, case):
    fill_calculator_until(page, "options", **case)

    if case["can_have_private"]:
        page.get_by_label("Get a quote", exact=True).click()
        assert_stage(page, "askABroker")
    else:
        expect(page.get_by_label("Get a quote", exact=True)).to_have_count(0)

    page.click("text=WhatsApp")
    page.get_by_label("Go back").click()
    assert_stage(page, "options")
