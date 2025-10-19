from . import load_calculator, get_calculator
import pytest


def test_first_step(page, assert_snapshot):
    load_calculator(page)
    assert_snapshot(get_calculator(page).screenshot())


@pytest.mark.parametrize(
    "occupation",
    [
        "studentUnemployed",
        "employee",
        "selfEmployed",
        "azubi",
        "unemployed",
    ],
)
def test_preset_occupation(page, assert_snapshot, occupation):
    load_calculator(page, preset_occupation=occupation)
    assert_snapshot(get_calculator(page).screenshot())
