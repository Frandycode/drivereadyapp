# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""add_coppa_fields

Revision ID: g4h5i6j7k8l9
Revises: b1c2d3e4f5a6
Create Date: 2026-05-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'g4h5i6j7k8l9'
down_revision = 'c9e0f1a2b3d4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.add_column('users', sa.Column(
        'parental_consent_status',
        sa.String(length=20),
        nullable=False,
        server_default='not_required',
    ))
    op.add_column('users', sa.Column('parent_email', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'parent_email')
    op.drop_column('users', 'parental_consent_status')
    op.drop_column('users', 'date_of_birth')
