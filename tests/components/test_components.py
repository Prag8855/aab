import pytest


@pytest.mark.parametrize(
    "component",
    [
        "collapsible",
        "eur",
        "glossary",
        "recommended",
    ],
)
def test_component_snapshot(page, assert_snapshot, component):
    page.goto(f"/tests/component/{component}")
    content = page.locator("main > article")
    assert_snapshot(content.screenshot())


def test_glossary_click(page, assert_snapshot):
    page.goto("/tests/component/glossary")
    page.locator("main > article a").first.click()

    dialog = page.locator("dialog").first
    assert dialog.evaluate("dialog => dialog.open")
    assert_snapshot(dialog.screenshot())

    dialog.locator(".close-button").click()
    assert not dialog.evaluate("dialog => dialog.open")


def test_recommended_click(page, assert_snapshot):
    page.goto("/tests/component/recommended")
    link = page.locator("main > article a.recommended").first

    # Test hover state
    link.hover()
    assert_snapshot(page.locator("main > article").screenshot())

    # Test click
    link.click()
    assert page.locator("dialog").first.evaluate("dialog => dialog.open")
