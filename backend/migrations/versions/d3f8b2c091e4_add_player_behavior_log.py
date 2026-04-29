# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""add_player_behavior_log

Revision ID: d3f8b2c091e4
Revises: fbc654a77ba3
Create Date: 2026-04-28 00:00:00.000000

Append-only event log for in-battle player behavior.
Records: forfeit, screen_leave, screen_return, auto_defeat,
         draw_requested, draw_accepted, draw_declined, disconnect.

leave_reason is always "unknown" on web; native mobile will set
"phone_call" when a CallKit / PhoneStateListener interrupt is detected.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'd3f8b2c091e4'
down_revision: Union[str, None] = 'fbc654a77ba3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'player_behavior_log',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('battle_id', sa.Uuid(), nullable=True),
        sa.Column('event_type', sa.String(length=30), nullable=False),
        sa.Column('detail', JSONB(), nullable=True),
        sa.Column('leave_reason', sa.String(length=20), nullable=True),
        sa.Column('was_forgiven', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['battle_id'], ['battles.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_player_behavior_log_user_id'),
        'player_behavior_log', ['user_id'], unique=False,
    )
    op.create_index(
        op.f('ix_player_behavior_log_battle_id'),
        'player_behavior_log', ['battle_id'], unique=False,
    )
    op.create_index(
        op.f('ix_player_behavior_log_event_type'),
        'player_behavior_log', ['event_type'], unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_player_behavior_log_event_type'), table_name='player_behavior_log')
    op.drop_index(op.f('ix_player_behavior_log_battle_id'), table_name='player_behavior_log')
    op.drop_index(op.f('ix_player_behavior_log_user_id'), table_name='player_behavior_log')
    op.drop_table('player_behavior_log')
