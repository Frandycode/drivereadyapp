# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""add_player_stats

Revision ID: a7e5d4f19c28
Revises: d3f8b2c091e4
Create Date: 2026-04-28 00:00:00.000000

One row per user — lifetime game stats, four-rail reputation, rank, and ban state.
Reputation starts at 100. Columns marked admin-only are excluded from
player-facing queries by the API layer.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7e5d4f19c28'
down_revision: Union[str, None] = 'd3f8b2c091e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'player_stats',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),

        # Game outcomes
        sa.Column('games_played',    sa.Integer(), nullable=False, server_default='0'),
        sa.Column('games_won',       sa.Integer(), nullable=False, server_default='0'),
        sa.Column('games_lost',      sa.Integer(), nullable=False, server_default='0'),
        sa.Column('games_tied',      sa.Integer(), nullable=False, server_default='0'),
        sa.Column('games_forfeited', sa.Integer(), nullable=False, server_default='0'),

        # Draw requests
        sa.Column('draw_requests_sent',     sa.Integer(), nullable=False, server_default='0'),
        sa.Column('draw_requests_accepted', sa.Integer(), nullable=False, server_default='0'),

        # Behavior counts
        sa.Column('screen_leave_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('disconnect_count',   sa.Integer(), nullable=False, server_default='0'),

        # Reputation (four rails — see architecture doc for reset rules)
        sa.Column('reputation_score',    sa.Integer(), nullable=False, server_default='100'),
        sa.Column('reputation_original', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('reputation_gold',     sa.Integer(), nullable=True),   # set on first Gold
        sa.Column('reputation_diamond',  sa.Integer(), nullable=True),   # set on first Diamond
        sa.Column('reputation_all_time', sa.Integer(), nullable=False, server_default='100'),

        # Rank
        sa.Column('game_rank', sa.String(length=10), nullable=False, server_default='bronze'),

        # Bans
        sa.Column('ban_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('ban_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_banned', sa.Boolean(), nullable=False, server_default='false'),

        # Admin-only
        sa.Column('total_play_time_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_session_duration_ms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_active_at', sa.DateTime(timezone=True), nullable=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_player_stats_user'),
    )
    op.create_index(
        op.f('ix_player_stats_user_id'),
        'player_stats', ['user_id'], unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_player_stats_user_id'), table_name='player_stats')
    op.drop_table('player_stats')
