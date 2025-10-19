from tests.health_insurance_calculator import fill_calculator_until, get_calculator
import pytest


def test_get_a_quote():
    pass


def test_prices():
    pass


def test_ask_an_expert():
    pass


@pytest.mark.parametrize(
    "case",
    [
        {
            "income": 30000,
            "occupation": "selfEmployed",
            "age": 30,
            "is_married": True,
            "children_count": 3,
            "is_applying_for_first_visa": True,
            "has_eu_public_insurance": True,
            "has_german_public_insurance": True,
        },
    ],
)
def test_preset_occupation(page, assert_snapshot, case):
    fill_calculator_until(page, "options", **case)
    assert_snapshot(get_calculator(page).screenshot())
