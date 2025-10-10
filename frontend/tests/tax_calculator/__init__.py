def fill_calculator(
    page,
    income=25000,
    occupation="employee",
    age=25,
    tax_class=1,
    children_count=0,
    is_married=False,
    zusatzbeitrag=1.5,
    religion=None,
    region="be-east",
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
