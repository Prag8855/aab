from playwright.sync_api import expect
from tests.health_insurance_calculator import assert_stage, cases, get_calculator, fill_calculator_until
import re


def test_snapshot(page, assert_snapshot):
    fill_calculator_until(page, "askABroker", **cases["employee-100k"])
    assert_snapshot(get_calculator(page).screenshot())


def test_whatsapp_validation(page, assert_snapshot):
    fill_calculator_until(page, "askABroker", **cases["employee-100k"])
    page.click("text=WhatsApp")
    expect(get_calculator(page)).not_to_have_class(re.compile(r".*show-errors.*"))
    page.locator(".button.whatsapp").click()
    expect(get_calculator(page)).to_have_class(re.compile(r".*show-errors.*"))
    assert_snapshot(get_calculator(page).screenshot())
    assert_stage(page, "askABroker")


def test_email_validation(page, assert_snapshot):
    fill_calculator_until(page, "askABroker", **cases["employee-100k"])
    page.click("text=Email")
    expect(get_calculator(page)).not_to_have_class(re.compile(r".*show-errors.*"))
    page.get_by_role("button", name="Ask").click()
    expect(get_calculator(page)).to_have_class(re.compile(r".*show-errors.*"))
    assert_snapshot(get_calculator(page).screenshot())
    assert_stage(page, "askABroker")
