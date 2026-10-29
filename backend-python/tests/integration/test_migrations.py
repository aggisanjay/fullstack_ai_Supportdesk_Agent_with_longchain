from __future__ import annotations

import os
import tempfile

from alembic.config import Config
from sqlalchemy import create_engine, inspect

from alembic import command


def test_alembic_migrations_upgrade_and_downgrade() -> None:
    """Verify that Alembic migrations run cleanly against a fresh isolated database.
    Tests upgrade to head, verifies created tables, and tests downgrade back to base.
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        test_db_path = os.path.join(tmp_dir, "migration_test.db").replace("\\", "/")
        db_url_async = f"sqlite+aiosqlite:///{test_db_path}"
        db_url_sync = f"sqlite:///{test_db_path}"

        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", db_url_async)

        # 1. Upgrade to head
        command.upgrade(alembic_cfg, "head")

        # 2. Inspect created tables in the SQLite database
        sync_engine = create_engine(db_url_sync)
        inspector = inspect(sync_engine)
        tables = set(inspector.get_table_names())

        expected_tables = {
            "users",
            "tickets",
            "ticket_messages",
            "kb_articles",
            "document_chunks",
            "telemetry_records",
            "alembic_version",
        }
        assert expected_tables.issubset(tables), f"Missing tables in migration: {expected_tables - tables}"

        # Verify columns on tickets table
        columns = {col["name"] for col in inspector.get_columns("tickets")}
        assert "customer_email" in columns
        assert "confidence_score" in columns
        assert "status" in columns

        # 3. Downgrade back to base
        command.downgrade(alembic_cfg, "base")

        # Verify tables are dropped
        tables_after = set(inspect(sync_engine).get_table_names())
        assert not any(t in tables_after for t in ["tickets", "users", "kb_articles", "telemetry_records"])

        sync_engine.dispose()
