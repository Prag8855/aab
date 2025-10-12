from ..tax_id_form import fill_tax_id_form_until, get_form


def test_start(page, assert_snapshot):
    fill_tax_id_form_until(page, "start")
    assert_snapshot(get_form(page).screenshot())
