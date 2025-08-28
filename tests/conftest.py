from pathlib import Path
import pytest


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {
        **browser_context_args,
        "reduced_motion": "reduce",  # Disable smooth scrolling
        "timezone_id": "Europe/Berlin",
        "locale": "fr-CA",
    }


def pytest_configure(config):
    tests_root = Path(__file__).parent.resolve()
    config.option.playwright_visual_snapshots_path = tests_root / 'snapshots'
    config.option.playwright_visual_snapshot_failures_path = tests_root / 'snapshot-failures'
