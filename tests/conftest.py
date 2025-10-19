from pathlib import Path
import pytest


DEVICE_CONFIGS = {
    "mobile": {  # iPhone 13 Mini
        "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
        "viewport": {"width": 375, "height": 629},
        "has_touch": True,
    },
    "tablet": {  # iPad Mini
        "user_agent": "Mozilla/5.0 (iPad; iPad14,2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Firefox/120.0 Mobile/15E148 Safari/604.1",
        "viewport": {"width": 744, "height": 1133},
        "has_touch": True,
    },
    "desktop": {  # Desktop
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 15.6; rv:142.0) Gecko/20100101 Firefox/142.0",
        "viewport": {"width": 1280, "height": 800},
        "has_touch": False,
    },
}


@pytest.fixture(scope="function", autouse=True)
def set_default_timeout(page):
    page.set_default_timeout(2000)


@pytest.fixture(params=DEVICE_CONFIGS.values(), ids=list(DEVICE_CONFIGS.keys()), scope="session")
def device_config(request):
    return request.param


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args, device_config):
    return {
        **browser_context_args,
        **device_config,
        "reduced_motion": "reduce",  # Disable smooth scrolling
        "timezone_id": "Europe/Berlin",
        "locale": "fr-CA",
        "ignore_https_errors": True,
    }


def pytest_configure(config):
    tests_root = Path(__file__).parent.resolve()
    config.option.playwright_visual_snapshots_path = tests_root / "snapshots"
    config.option.playwright_visual_snapshot_failures_path = tests_root / "snapshot-failures"
