# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""add_legal_consent

Revision ID: i6j7k8l9m0n1
Revises: h5i6j7k8l9m0
Create Date: 2026-05-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'i6j7k8l9m0n1'
down_revision = 'h5i6j7k8l9m0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Quick-lookup columns on users
    op.add_column('users', sa.Column('tos_version_accepted', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('privacy_version_accepted', sa.String(20), nullable=True))

    # Full audit log
    op.create_table(
        'user_consents',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True),
                  primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('document_type', sa.String(20), nullable=False),  # 'tos' | 'privacy'
        sa.Column('version', sa.String(20), nullable=False),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('ip_address', sa.String(45), nullable=True),
    )
    op.create_index('ix_user_consents_user_id', 'user_consents', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_user_consents_user_id', table_name='user_consents')
    op.drop_table('user_consents')
    op.drop_column('users', 'privacy_version_accepted')
    op.drop_column('users', 'tos_version_accepted')
