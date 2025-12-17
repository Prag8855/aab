def test_markdown_elements(page, test_screenshot):
    page.goto("/tests/markdown")
    content = page.locator("main > article")
    test_screenshot(page, content)
