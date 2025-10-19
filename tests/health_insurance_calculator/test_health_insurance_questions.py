import pytest
from . import (
    occupations,
    see_options,
    fill_calculator_until,
    get_calculator,
)
from playwright.sync_api import expect

import re


@pytest.mark.parametrize("occupation", occupations, ids=occupations)
def test_questions_by_occupation(page, assert_snapshot, occupation):
    fill_calculator_until(page, "questions", occupation=occupation)
    assert_snapshot(get_calculator(page).screenshot())


def test_questions_complicated(page, assert_snapshot):
    fill_calculator_until(page, "questions", occupation="other")
    assert_snapshot(get_calculator(page).screenshot())


def test_data_validity_check(page, assert_snapshot):
    fill_calculator_until(page, "questions", occupation="employee")
    expect(get_calculator(page)).not_to_have_class(re.compile(r".*show-errors.*"))

    see_options(page)

    expect(get_calculator(page)).to_have_class(re.compile(r".*show-errors.*"))

    assert_snapshot(get_calculator(page).screenshot())
