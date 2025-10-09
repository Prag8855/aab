from . import load_calculator, select_occupation, get_calculator


def test_first_step(page, assert_snapshot):
    load_calculator(page)
    assert_snapshot(get_calculator(page).screenshot())
