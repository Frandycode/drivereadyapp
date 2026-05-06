# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""nullable session user_id — allow anonymous sessions

Revision ID: m0n1o2p3q4r5
Revises: l9m0n1o2p3q4
Create Date: 2026-05-06
"""

from alembic import op
import sqlalchemy as sa

revision = 'm0n1o2p3q4r5'
down_revision = 'l9m0n1o2p3q4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('sessions', 'user_id', nullable=True)


def downgrade() -> None:
    # Rows with NULL user_id must be cleaned up before downgrading
    op.execute("DELETE FROM sessions WHERE user_id IS NULL")
    op.alter_column('sessions', 'user_id', nullable=False)
