# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""add_chapter_groups

Revision ID: c9e0f1a2b3d4
Revises: b1c2d3e4f5a6
Create Date: 2026-04-30 00:00:00.000000

User-defined (and admin-preset) chapter groups for Study and Challenge.
is_preset=True rows are visible to all users; user rows are owner-only.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c9e0f1a2b3d4'
down_revision: Union[str, None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'chapter_groups',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('state_code', sa.String(5), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('chapter_numbers', sa.ARRAY(sa.Integer()), nullable=False, server_default='{}'),
        sa.Column('is_preset', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_chapter_groups_user_id',    'chapter_groups', ['user_id'])
    op.create_index('ix_chapter_groups_state_code', 'chapter_groups', ['state_code'])


def downgrade() -> None:
    op.drop_index('ix_chapter_groups_state_code', table_name='chapter_groups')
    op.drop_index('ix_chapter_groups_user_id',    table_name='chapter_groups')
    op.drop_table('chapter_groups')
