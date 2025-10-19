from playwright.sync_api import expect
from tests.health_insurance_calculator import assert_stage, fill_calculator_until, get_calculator
import pytest


CASES = {
    "selfEmployed-20k": {
        "income": 20000,
        "occupation": "selfEmployed",
        "age": 30,
        "is_married": True,
        "children_count": 3,
        "is_applying_for_first_visa": True,
        "has_eu_public_insurance": True,
        "has_german_public_insurance": True,
        "can_have_private": True,
    },
    "selfEmployed-100k": {
        "income": 100000,
        "occupation": "selfEmployed",
        "age": 40,
        "is_married": False,
        "children_count": 0,
        "is_applying_for_first_visa": True,
        "has_eu_public_insurance": False,
        "has_german_public_insurance": False,
        "can_have_private": True,
    },
    "employee-30k": {
        "income": 30000,
        "occupation": "employee",
        "age": 40,
        "is_married": True,
        "children_count": 1,
        "is_applying_for_first_visa": True,
        "has_eu_public_insurance": False,
        "has_german_public_insurance": False,
        "can_have_private": False,
    },
    "employee-100k": {
        "income": 100000,
        "occupation": "employee",
        "age": 40,
        "is_married": True,
        "children_count": 1,
        "is_applying_for_first_visa": True,
        "has_eu_public_insurance": False,
        "has_german_public_insurance": False,
        "can_have_private": True,
    },
    "studentUnemployed": {
        "income": 0,
        "occupation": "studentUnemployed",
        "age": 23,
        "is_married": True,
        "children_count": 0,
        "is_applying_for_first_visa": True,
        "has_eu_public_insurance": False,
        "has_german_public_insurance": True,
        "can_have_private": True,
    },
    "studentOver30": {
        "income": 0,
        "occupation": "studentUnemployed",
        "age": 30,
        "is_married": False,
        "children_count": 0,
        "is_applying_for_first_visa": True,
        "has_eu_public_insurance": False,
        "has_german_public_insurance": True,
        "can_have_private": True,
    },
    "studentEmployee": {
        "income": 10000,
        "occupation": "studentEmployee",
        "age": 23,
        "is_married": False,
        "children_count": 1,
        "is_applying_for_first_visa": True,
        "has_eu_public_insurance": False,
        "has_german_public_insurance": True,
        "can_have_private": True,
    },
    "studentSelfEmployed": {
        "income": 10000,
        "occupation": "studentSelfEmployed",
        "age": 23,
        "is_married": True,
        "children_count": 1,
        "is_applying_for_first_visa": True,
        "has_eu_public_insurance": False,
        "has_german_public_insurance": True,
        "can_have_private": True,
    },
}


@pytest.mark.parametrize("case", CASES.values(), ids=CASES.keys())
def test_options(page, assert_snapshot, case):
    fill_calculator_until(page, "options", **case)
    assert_snapshot(get_calculator(page).screenshot())


@pytest.mark.parametrize("case", CASES.values(), ids=CASES.keys())
def test_option_ask_a_broker(page, case):
    fill_calculator_until(page, "options", **case)
    page.get_by_label("Ask our expert", exact=True).click()
    assert_stage(page, "askABroker")


@pytest.mark.parametrize("case", CASES.values(), ids=CASES.keys())
def test_option_private_quote(page, case):
    fill_calculator_until(page, "options", **case)

    if case["can_have_private"]:
        page.get_by_label("Get a quote", exact=True).click()
        assert_stage(page, "askABroker")
    else:
        expect(page.get_by_label("Get a quote", exact=True)).to_have_count(0)
