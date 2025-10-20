from playwright.sync_api import expect
from tests.health_insurance_calculator import assert_stage, cases, get_calculator, fill_calculator_until
import json
import re


def test_snapshot(page, assert_snapshot):
    fill_calculator_until(page, "askABroker", **cases["employee-100k"])
    assert_snapshot(get_calculator(page).screenshot())


def test_by_whatsapp(page, assert_snapshot):
    case = cases["employee-100k"]

    fill_calculator_until(page, "askABroker", **case)
    page.click("text=WhatsApp")
    expect(get_calculator(page)).not_to_have_class(re.compile(r".*show-errors.*"))
    page.locator(".button.whatsapp").click()
    expect(get_calculator(page)).to_have_class(re.compile(r".*show-errors.*"))
    assert_snapshot(get_calculator(page).screenshot())
    assert_stage(page, "askABroker")

    page.get_by_label("Your name").fill("John Doe")

    with page.expect_request("**/api/insurance/case") as api_request:
        page.locator(".button.whatsapp").click()
    request_data = json.loads(api_request.value.post_data)

    expected_response = {
        **case,
        "name": "John Doe",
        "email": "",
        "question": "",
        "referrer": "test-referrer",
        "contact_method": "WHATSAPP",
        "broker": "seamus-wolf",
    }
    expected_response.pop("can_have_private")
    assert request_data == expected_response

    assert_snapshot(get_calculator(page).screenshot())
    assert_stage(page, "thank-you")

    page.get_by_label("Go back").click()
    assert_stage(page, "occupation")


def test_by_email(page, assert_snapshot):
    case = cases["employee-100k"]

    fill_calculator_until(page, "askABroker", **case)
    page.click("text=Email")
    expect(get_calculator(page)).not_to_have_class(re.compile(r".*show-errors.*"))
    page.get_by_role("button", name="Ask Seamus").click()
    expect(get_calculator(page)).to_have_class(re.compile(r".*show-errors.*"))
    assert_snapshot(get_calculator(page).screenshot())
    assert_stage(page, "askABroker")

    page.get_by_label("Your name").fill("John Doe")
    page.get_by_label("Email address").fill("j.doe@example.com")
    page.get_by_label("Question").fill("This is a question\nPlease answer soon")

    with page.expect_request("**/api/insurance/case") as api_request:
        page.get_by_role("button", name="Ask Seamus").click()
    request_data = json.loads(api_request.value.post_data)

    expected_response = {
        **case,
        "name": "John Doe",
        "email": "j.doe@example.com",
        "question": "This is a question\nPlease answer soon",
        "referrer": "test-referrer",
        "contact_method": "EMAIL",
        "broker": "seamus-wolf",
    }
    expected_response.pop("can_have_private")
    assert request_data == expected_response

    assert_snapshot(get_calculator(page).screenshot())
    assert_stage(page, "thank-you")

    page.get_by_label("Go back").click()
    assert_stage(page, "occupation")
