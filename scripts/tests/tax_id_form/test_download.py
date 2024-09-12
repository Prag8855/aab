from ..test_data import people
from ..tax_id_form import fill_tax_id_form_until


def test_download_buttons_no_anmeldung(page):
    fill_tax_id_form_until(page, 'options', multiple_people=True, purpose="I can't register my address, but I need a tax ID")

    for index in range(0, 5):
        download_button = page.get_by_role("button", name=f"Download the application form for {people[index]['first_name']}")
        with page.expect_download() as download_info:
            download_button.click()
            download = download_info.value
            assert download.suggested_filename == 'tax-id-form-filled.pdf'
            download.save_as(f"/Users/nicolas/Downloads/tax-id-{index}.pdf")


def test_download_buttons_living_abroad(page):
    fill_tax_id_form_until(page, 'options', multiple_people=True, purpose="I don't live in Germany, but I need a tax ID")

    for index in range(0, 5):
        download_button = page.get_by_role("button", name=f"Download the application form for {people[index]['first_name']}")
        with page.expect_download() as download_info:
            download_button.click()
            download = download_info.value
            assert download.suggested_filename == 'tax-id-form-filled.pdf'
            download.save_as(f"/Users/nicolas/Downloads/tax-id-{index}.pdf")
