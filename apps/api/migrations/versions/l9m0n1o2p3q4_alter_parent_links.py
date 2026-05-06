# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""alter_parent_links_nullable_parent_add_expiry

Revision ID: l9m0n1o2p3q4
Revises: k8l9m0n1o2p3
Create Date: 2026-05-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'l9m0n1o2p3q4'
down_revision = 'k8l9m0n1o2p3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('parent_links', 'parent_id', nullable=True)
    op.add_column(
        'parent_links',
        sa.Column('link_code_expires_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('parent_links', 'link_code_expires_at')
    # Re-populate nulls before restoring NOT NULL (best-effort)
    op.execute("DELETE FROM parent_links WHERE parent_id IS NULL")
    op.alter_column('parent_links', 'parent_id', nullable=False)
