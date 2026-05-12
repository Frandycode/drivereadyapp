# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""partial unique index on users.phone_number

Revision ID: n1o2p3q4r5s6
Revises: m0n1o2p3q4r5
Create Date: 2026-05-12
"""

from alembic import op
import sqlalchemy as sa

revision = 'n1o2p3q4r5s6'
down_revision = 'm0n1o2p3q4r5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        'uq_users_phone_number',
        'users',
        ['phone_number'],
        unique=True,
        postgresql_where=sa.text('phone_number IS NOT NULL'),
    )


def downgrade() -> None:
    op.drop_index('uq_users_phone_number', table_name='users')
