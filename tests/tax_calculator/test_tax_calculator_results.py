from decimal import Decimal
import pytest
import re


# Tests run on multiple viewport sizes by default, but it's not necessary for these tests
@pytest.fixture(
    params=[
        {  # Desktop
            "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 15.6; rv:142.0) Gecko/20100101 Firefox/142.0",
            "viewport": {"width": 1280, "height": 800},
            "has_touch": False,
        }
    ],
    scope="session",
)
def device_config(request):
    return request.param


@pytest.fixture(scope="session")
def context(browser, browser_context_args):
    browser_context_args["locale"] = "en-GB"  # Sets correct number format, cookie banner language
    new_context = browser.new_context(**browser_context_args)
    yield new_context
    new_context.close()


@pytest.fixture(scope="session")
def external_tax_calculator(context):
    page = context.new_page()
    page.set_default_timeout(5000)
    page.goto("https://www.smart-rechner.de/lohnsteuer/rechner.php")

    cookie_popup = page.locator("#cmpwrapper")
    cookie_popup.get_by_role("button", name="Settings", exact=True).click()
    cookie_popup.get_by_role("button", name="Save + Exit", exact=True).click()

    # Yearly calculation
    page.locator("#s_r_de_lohnsteuer_lohnzahlungszeitraum-button").get_by_text("Monatsbrutto").click()
    page.get_by_role("option", name="Jahresbrutto").click()

    return page


@pytest.fixture(scope="session")
def local_tax_calculator(context):
    page = context.new_page()
    page.goto("/tests/component/tax-calculator")
    page.get_by_role("link", name="Show options").click()
    return page


def get_external_results(
    page, income, occupation, age, tax_class, children_count, is_married, zusatzbeitrag, religion, region
):
    def get_numerical_value(row_title):
        content = (
            page.locator("#s_r_de_lohnsteuer_result tr", has_text=row_title)
            .locator("td:last-child")
            .first.text_content()
        )
        return Decimal(re.sub(r"[^0-9\,]", "", content).replace(",", ".")).quantize(Decimal("0.01"))

    spinner = page.locator(".sanduhr-or-fehler.ui-priority-secondary")

    # Income
    page.locator("#s_r_de_lohnsteuer_bruttolohn").fill(str(income))

    # Tax class
    tax_class_label = [None, "I", "II", "III", "IV", "V", "VI"][tax_class]
    page.get_by_role("button", name=tax_class_label, exact=True).click()

    # Children
    page.locator("#s_r_de_lohnsteuer_kinderanzahl-button").click()
    if children_count == 0:
        if age >= 23:
            page.get_by_role("option", name="Kinderlos, mind. 23").click()
        else:
            page.get_by_role("option", name="Kinderlos, unter 23").click()
    elif children_count == 1:
        page.get_by_role("option", name="1 Kind").click()
    elif children_count in [2, 3, 4]:
        page.get_by_role("option", name=f"{children_count} Kinder").click()
    elif children_count > 4:
        page.get_by_role("option", name="5 oder mehr Kinder").click()

    # Region
    bundesland = {
        "bb": "Brandenburg",
        "by": "Bayern",
        "be-west": "Berlin‑West",  # Note: hyphen is non-standard character
        "be-east": "Berlin‑Ost",
    }
    page.locator("#s_r_de_lohnsteuer_bundesland-button").click()
    page.get_by_role("option", name=bundesland[region]).click()

    # Church tax
    page.locator("#s_r_de_lohnsteuer_kirchensteuer").get_by_role("button", name="Ja" if religion else "Nein").click()

    # Health insurance
    page.get_by_label("Zusatzbeitrag Krankenvers. in %").fill(str(zusatzbeitrag).replace(".", ","))

    page.get_by_role("button", name="Berechnen").click()
    spinner.wait_for(state="visible")
    spinner.wait_for(state="hidden")

    return {
        "health_insurance": (
            get_numerical_value("% Krankenversicherung")
            + get_numerical_value("% KV Zusatzbeitrag")
            + get_numerical_value("% Pflegeversicherung")
        ),
        "public_pension": get_numerical_value("% Rentenversicherung"),
        "unemployment_insurance": get_numerical_value("% Arbeitslosenversicherung"),
        "income_tax": get_numerical_value("Lohnsteuer"),
        "solidarity_surcharge": get_numerical_value("Solidaritätszuschlag") or None,
        "church_tax": get_numerical_value("Kirchensteuer") if religion else None,
    }


def get_local_results(
    page, income, occupation, age, tax_class, children_count, is_married, zusatzbeitrag, religion, region
):
    page.get_by_label("Salary").fill(str(income))
    page.get_by_label("Occupation").select_option(occupation)
    page.get_by_label("Where do you work?").select_option(region)
    page.get_by_label("Age", exact=True).fill(str(age))
    page.get_by_label("Religion").select_option(religion or "other")
    page.get_by_label("Health insurance").select_option("public-custom")
    page.get_by_label("Insurer surcharge").fill(str(zusatzbeitrag))
    page.get_by_text("Married", exact=True).set_checked(is_married)
    page.get_by_role("combobox", name="Children").select_option(str(children_count))
    page.get_by_text(f"Tax class {tax_class}").click()

    def get_numerical_value(collapsible_title):
        if page.locator("summary", has_text=collapsible_title).is_visible(timeout=0):
            value = page.locator("summary", has_text=collapsible_title).locator(".currency").text_content()
            return Decimal(re.sub(r"[^0-9\.]", "", value)).quantize(Decimal("0.01"))
        else:
            return None

    return {
        "health_insurance": get_numerical_value("Health insurance"),
        "public_pension": get_numerical_value("Public pension"),
        "unemployment_insurance": get_numerical_value("Unemployment insurance"),
        "income_tax": get_numerical_value("Income tax"),
        "solidarity_surcharge": get_numerical_value("Solidarity surcharge") or None,
        "church_tax": get_numerical_value("Church tax") if religion else None,
    }


def compare_results(actual: dict, expected: dict, tax_calculator_params: dict):
    keys = set([*actual.keys(), *expected.keys()])

    errors = ""
    for key in keys:
        act = actual.get(key)
        exp = expected.get(key)
        if act != exp:
            if isinstance(act, Decimal) and isinstance(exp, Decimal):
                if act - exp > 2:
                    errors += f"\n\t{key:<25}: {act or '':<8} != {exp or '':<8}"
            else:
                errors += f"\n\t{key:<25}: {act or '':<8} != {exp or '':<8}"

    if errors:
        params = "".join([f"\n\t{key:<25}: {value}" for key, value in tax_calculator_params.items()])
        pytest.fail(f"PARAMS:{params}\n\nDIFF:{errors}", pytrace=False)


@pytest.mark.parametrize("age", [21, 23, 31])
@pytest.mark.parametrize("income", [10000, 25000, 45000, 80000, 110000, 1000000])
@pytest.mark.parametrize("is_married", [False])  # [True, False]
@pytest.mark.parametrize("children_count", [0, 1, 2, 6])
@pytest.mark.parametrize("region", ["be-east", "be-west"])  # ['be-east', 'be-west', 'by', 'bb']
@pytest.mark.parametrize("tax_class", [1])  # [1, 2, 3, 4, 5, 6]
@pytest.mark.parametrize("zusatzbeitrag", [2.9])
def test_results(
    local_tax_calculator,
    external_tax_calculator,
    age,
    children_count,
    income,
    is_married,
    region,
    tax_class,
    zusatzbeitrag,
):
    if is_married and tax_class in (1, 2, 6):
        return
    elif not is_married:
        if tax_class in (3, 4, 5):
            return
        if not children_count and tax_class == 2:
            return

    tax_calculator_params = {
        "age": age,
        "children_count": children_count,
        "income": income,
        "is_married": is_married,
        "occupation": "employee",
        "region": region,
        "religion": None,
        "tax_class": tax_class,
        "zusatzbeitrag": zusatzbeitrag,
    }

    compare_results(
        actual=get_local_results(local_tax_calculator, **tax_calculator_params),
        expected=get_external_results(external_tax_calculator, **tax_calculator_params),
        tax_calculator_params=tax_calculator_params,
    )
