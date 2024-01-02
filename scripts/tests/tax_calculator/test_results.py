from decimal import Decimal
import re


def fill_calculator(
    page,
    income=25000,
    occupation="employee",
    age=25,
    tax_class=1,
    children_count=0,
    is_married=False,
    health_insurer=None,
    religion=None,
    region="be-east",
):
    page.get_by_role("link", name="Show options").click()
    page.get_by_label("Salary").fill(f"{income}")
    page.get_by_label("Occupation").select_option(occupation)
    page.get_by_label("Where do you work?").select_option("be-east")
    page.get_by_label("Age", exact=True).fill(f"{age}")
    page.get_by_label("Religion").select_option(religion or "other")
    page.get_by_label("Health insurance").select_option(health_insurer or "unknown")
    page.get_by_text("Married", exact=True).set_checked(is_married)
    page.get_by_label("Children").select_option(f"{children_count}")
    page.get_by_text(f"Tax class {tax_class}").click()


def verify_results(
    page,
    health_insurance=None,
    public_pension=None,
    unemployment_insurance=None,
    income_tax=None,
    solidarity_surcharge=None,
    church_tax=None,
):
    def get_numerical_value(collapsible_title):
        content = page.locator("summary", has_text=collapsible_title).locator("output").text_content()
        return Decimal(re.sub(r'[^0-9\.]', '', content))

    if health_insurance is not None:
        print('health_insurance:', health_insurance)
        assert get_numerical_value("Health insurance") == round(health_insurance)
    if public_pension is not None:
        print('public_pension:', public_pension)
        assert get_numerical_value("Public pension") == round(public_pension)
    if unemployment_insurance is not None:
        print('unemployment_insurance:', unemployment_insurance)
        assert get_numerical_value("Unemployment insurance") == round(unemployment_insurance)
    if income_tax is not None:
        print('income_tax:', income_tax)
        assert get_numerical_value("Income tax") == round(income_tax)
    if solidarity_surcharge is not None:
        print('solidarity_surcharge:', solidarity_surcharge)
        assert get_numerical_value("Solidarity surcharge") == round(solidarity_surcharge)
    if church_tax is not None:
        print('church_tax:', church_tax)
        assert get_numerical_value("Church tax") == round(church_tax)


def get_external_results(
    page,
    income=25000,
    occupation="employee",
    age=25,
    tax_class=1,
    children_count=0,
    is_married=False,
    health_insurer=None,
    religion=None,
    region="be-east",
):
    def get_numerical_value(row_title):
        content = page.locator("#s_r_de_lohnsteuer_result tr", has_text=row_title).locator("td:last-child").first.text_content()
        return Decimal(re.sub(r'[^0-9\,]', '', content).replace(',', '.'))

    # Cookie banner
    page.frame_locator("iframe[title=\"SP Consent Message\"]").get_by_label("Akzeptieren").click()

    # Income
    page.locator("#s_r_de_lohnsteuer_bruttolohn").fill(f"{income}")

    # Yearly calculation
    page.locator("#s_r_de_lohnsteuer_lohnzahlungszeitraum-button").get_by_text("Monatsbrutto").click()
    page.get_by_role("option", name="Jahresbrutto").click()

    # Tax class
    tax_class_label = [None, 'I', 'II', 'III', 'IV', 'V', 'VI'][tax_class]
    page.get_by_role("button", name=tax_class_label, exact=True).click()

    # Children
    page.locator("#s_r_de_lohnsteuer_kinderanzahl-button").get_by_text("Kinderlos, mind. 23").click()
    page.get_by_role("option", name="Kinderlos, mind. 23").click()

    # Region
    page.locator("#s_r_de_lohnsteuer_bundesland-button").get_by_text("Baden‑Württemb.").click()
    page.get_by_role("option", name="Brandenburg").click()

    # Church tax
    page.locator("#s_r_de_lohnsteuer_kirchensteuer").get_by_role("button", name="Ja" if religion else "Nein").click()

    # Health insurance
    page.get_by_label("Zusatzbeitrag Krankenvers. in %").click()
    page.get_by_label("Zusatzbeitrag Krankenvers. in %").fill("1,2")

    page.get_by_role("button", name="Berechnen").click()

    return dict(
        health_insurance=(
            get_numerical_value("% Krankenversicherung")
            + get_numerical_value("% KV Zusatzbeitrag")
            + get_numerical_value("% Pflegeversicherung")
        ),
        public_pension=get_numerical_value("% Rentenversicherung"),
        unemployment_insurance=get_numerical_value("% Arbeitslosenversicherung"),
        income_tax=get_numerical_value("Lohnsteuer"),
        solidarity_surcharge=get_numerical_value("Solidaritätszuschlag") or None,
        church_tax=get_numerical_value("Kirchensteuer") if religion else None,
    )


def test_30k_income(context):
    calc_page = context.new_page()
    calc_page.goto("/tools/tax-calculator")

    external_calc_page = context.new_page()
    external_calc_page.goto("https://www.smart-rechner.de/lohnsteuer/rechner.php")

    calc_params = dict(
        income=25000,
        occupation="employee",
        age=25,
        tax_class=1,
        children_count=0,
        is_married=False,
        health_insurer=None,
        religion=None,
        region="be-east"
    )

    fill_calculator(calc_page, **calc_params)
    expected = get_external_results(external_calc_page, **calc_params)
    verify_results(calc_page, **expected)
