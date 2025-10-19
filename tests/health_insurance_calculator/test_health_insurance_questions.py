from . import (
    load_calculator,
    select_occupation,
    see_options,
    fill_calculator_until,
    get_calculator,
)
from playwright.sync_api import expect

import re


def test_questions_employee(page, assert_snapshot):
    load_calculator(page)
    select_occupation(page, "employee")
    assert_snapshot(get_calculator(page).screenshot())


def test_questions_student(page, assert_snapshot):
    load_calculator(page)
    select_occupation(page, "studentUnemployed")
    assert_snapshot(get_calculator(page).screenshot())


def test_questions_self_employed(page, assert_snapshot):
    load_calculator(page)
    select_occupation(page, "selfEmployed")
    assert_snapshot(get_calculator(page).screenshot())


def test_questions_apprentice(page, assert_snapshot):
    load_calculator(page)
    select_occupation(page, "azubi")
    assert_snapshot(get_calculator(page).screenshot())


def test_questions_unemployed(page, assert_snapshot):
    load_calculator(page)
    select_occupation(page, "unemployed")
    assert_snapshot(get_calculator(page).screenshot())


def test_questions_complicated(page, assert_snapshot):
    load_calculator(page)
    select_occupation(page, "other")
    assert_snapshot(get_calculator(page).screenshot())


def test_data_validity_check(page, assert_snapshot):
    fill_calculator_until(page, "questions")
    expect(get_calculator(page)).not_to_have_class(re.compile(r".*show-errors.*"))

    see_options(page)

    expect(get_calculator(page)).to_have_class(re.compile(r".*show-errors.*"))

    assert_snapshot(get_calculator(page).screenshot())
