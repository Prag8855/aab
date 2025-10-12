from . import load_calculator, get_calculator


def test_first_step(page, assert_snapshot):
    load_calculator(page)
    assert_snapshot(get_calculator(page).screenshot())
