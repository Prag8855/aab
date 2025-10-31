from playwright.sync_api import expect
import json
import pytest


@pytest.fixture(scope="function", autouse=True)
def pension_refund_calculator(page):
    page.goto("/tests/component/pension-refund-calculator")
    return page.get_by_role("group", name="Pension refund calculator")


def fill_calculator(page):
    page.get_by_label("Nationality").select_option("Canada")
    page.get_by_label("Where do you live?").select_option("United States")
    page.get_by_label("First month of work in Germany").select_option("January")
    page.get_by_label("First year of work in Germany").select_option("2020")
    page.get_by_label("Last month of work in Germany").select_option("February")
    page.get_by_label("Last year of work in Germany").select_option("2022")
    page.get_by_label("Salary in Germany").fill("50000")


def test_default_state(page, pension_refund_calculator, assert_snapshot):
    assert_snapshot(pension_refund_calculator.screenshot())


def test_eligible(page, pension_refund_calculator, assert_snapshot):
    fill_calculator(page)
    assert_snapshot(pension_refund_calculator.screenshot())


def test_apply_for_refund(page, pension_refund_calculator, assert_snapshot):
    fill_calculator(page)
    page.get_by_role("button", name="Apply for a refund").click()
    assert_snapshot(pension_refund_calculator.screenshot())
    page.get_by_label("FundsBack").click()
    page.get_by_role("button", name="Request a refund").click()
    page.get_by_role("button", name="Send request").click()  # Form error
    assert_snapshot(pension_refund_calculator.screenshot())
    page.get_by_label("Full name").fill("John Smith")
    page.get_by_label("Email address").fill("testaccount@gmail.com")
    page.get_by_title("Day of the month").fill("3")
    page.get_by_title("Month", exact=True).fill("9")
    page.get_by_title("Year").fill("1995")

    with page.expect_request("**/api/forms/pension-refund-request") as api_request:
        page.get_by_role("button", name="Send request").click()
    request_data = json.loads(api_request.value.post_data)
    assert request_data == {
        "arrival_date": "2020-01-01",
        "departure_date": "2022-02-01",
        "birth_date": "1995-09-03",
        "nationality": "CA",
        "country_of_residence": "US",
        "email": "testaccount@gmail.com",
        "name": "John Smith",
        "partner": "fundsback",
    }

    expect(pension_refund_calculator).to_contain_text("Request sent")
    assert_snapshot(pension_refund_calculator.screenshot())


def test_diy_refund(page, pension_refund_calculator, assert_snapshot):
    fill_calculator(page)
    page.get_by_role("button", name="Apply for a refund").click()
    page.get_by_label("Do it yourself").click()
    assert_snapshot(pension_refund_calculator.screenshot())


def test_east_west_germany(page, pension_refund_calculator, assert_snapshot):
    fill_calculator(page)
    page.get_by_label("Salary in Germany").fill("150000")
    page.get_by_label("Where did you work?").select_option("Brandenburg")
    refund_east = pension_refund_calculator.locator(".price.large").text_content()
    page.get_by_label("Where did you work?").select_option("Bavaria")
    refund_west = pension_refund_calculator.locator(".price.large").text_content()
    assert refund_east != refund_west
    assert_snapshot(pension_refund_calculator.screenshot())


def test_not_eligible_month(page, pension_refund_calculator, assert_snapshot):
    fill_calculator(page)
    page.get_by_label("First year of work in Germany").select_option("2000")
    expect(pension_refund_calculator).to_contain_text("You can't get a pension refund")
    assert_snapshot(pension_refund_calculator.screenshot())


def test_not_eligible_country_of_residence(page, pension_refund_calculator, assert_snapshot):
    page.get_by_label("Nationality").select_option("Canada")
    page.get_by_label("Where do you live?").select_option("France")
    assert_snapshot(pension_refund_calculator.screenshot())


def test_not_eligible_nationality(page, pension_refund_calculator, assert_snapshot):
    page.get_by_label("Nationality").select_option("France")
    page.get_by_label("Where do you live?").select_option("Canada")
    assert_snapshot(pension_refund_calculator.screenshot())
