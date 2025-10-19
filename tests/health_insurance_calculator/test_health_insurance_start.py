from . import fill_calculator_until, occupations, get_calculator
import pytest


def test_first_step(page, assert_snapshot):
    fill_calculator_until(page, "occupation")
    assert_snapshot(get_calculator(page).screenshot())


@pytest.mark.parametrize("occupation", occupations, ids=occupations)
def test_first_step_preset_occupation(page, assert_snapshot, occupation):
    fill_calculator_until(page, "occupation", preset_occupation=True, occupation=occupation)
    assert_snapshot(get_calculator(page).screenshot())
