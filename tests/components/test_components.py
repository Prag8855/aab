def test_components(page, assert_snapshot):
    page.goto("/tests/components")
    content = page.locator("main > article")
    assert_snapshot(content.screenshot())
