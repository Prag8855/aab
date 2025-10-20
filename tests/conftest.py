from pathlib import Path
from pytest_playwright_visual_snapshot.plugin import SnapshotPaths, _get_option
import pytest
import shutil


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


@pytest.fixture(scope="session", autouse=True)
def cleanup_snapshot_failures(pytestconfig):
    """
    Override the original to make it work with xdist
    TODO: Remove when this PR is closed (2025-10-20): https://github.com/iloveitaly/pytest-playwright-visual-snapshot/pull/48
    """

    root_dir = Path(pytestconfig.rootdir)

    # Compute paths once
    SnapshotPaths.snapshots_path = Path(
        _get_option(pytestconfig, "playwright_visual_snapshots_path", cast=str) or (root_dir / "__snapshots__")
    )

    SnapshotPaths.failures_path = Path(
        _get_option(pytestconfig, "playwright_visual_snapshot_failures_path", cast=str)
        or (root_dir / "snapshot_failures")
    )

    # This is the part I fixed
    shutil.rmtree(SnapshotPaths.failures_path, ignore_errors=True)

    SnapshotPaths.failures_path.mkdir(parents=True, exist_ok=True)

    yield


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
