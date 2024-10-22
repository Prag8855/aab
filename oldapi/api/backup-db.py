#!/usr/bin/env python3
from datetime import datetime
from dateutil.relativedelta import relativedelta
from shutil import copy
import config
import logging
import requests

logging.basicConfig(**config.logging_config)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    config.backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = config.backup_dir / (datetime.now().strftime('%Y-%m-%d') + '.db')
    logger.info(f"Backing up database to {str(backup_path)}")
    copy(config.db_path, backup_path)

    one_month_ago = datetime.now() - relativedelta(months=1)

    for file in config.backup_dir.iterdir():
        if file.is_file():
            try:
                file_date = datetime.strptime(file.stem, '%Y-%m-%d')
                if file_date.date() < one_month_ago.date():
                    logger.info(f"Removing old database backup at {str(file)}")
                    file.unlink()
            except ValueError:
                pass

    requests.get('https://uptime.betterstack.com/api/v1/heartbeat/Rj7rja9iWDvaFXcAsHhdK5tD')
