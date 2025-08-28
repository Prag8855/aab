def test_markdown_elements(page, assert_snapshot):
    page.goto("/tests/markdown")
    content = page.locator("main > article")
    assert_snapshot(content.screenshot())
