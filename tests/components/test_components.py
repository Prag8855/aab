import pytest


@pytest.mark.parametrize(
    "component",
    [
        "collapsible",
        "eur",
    ],
)
def test_component_snapshot(page, assert_snapshot, component):
    page.goto(f"/tests/component/{component}")
    content = page.locator("main > article")
    assert_snapshot(content.screenshot())
