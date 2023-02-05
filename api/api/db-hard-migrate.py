#!/usr/bin/env python3
from main import db, engine, ScheduledMessage
import config
import logging

logging.basicConfig(**config.logging_config)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    ScheduledMessage.__table__.drop(engine)
    db.create_all()
