from tests.health_insurance_calculator import fill_calculator_until, get_calculator
import pytest


def test_get_a_quote():
    pass


def test_prices():
    pass


def test_ask_an_expert():
    pass


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
    },
}


@pytest.mark.parametrize("case", CASES.values(), ids=CASES.keys())
def test_options(page, assert_snapshot, case):
    fill_calculator_until(page, "options", **case)
    assert_snapshot(get_calculator(page).screenshot())
