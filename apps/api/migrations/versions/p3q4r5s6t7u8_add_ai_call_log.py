# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""ai_call_log — per-call observability for AI features

Revision ID: p3q4r5s6t7u8
Revises: o2p3q4r5s6t7
Create Date: 2026-05-12
"""

from alembic import op
import sqlalchemy as sa

revision = 'p3q4r5s6t7u8'
down_revision = 'o2p3q4r5s6t7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'ai_call_log',
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('route', sa.String(length=60), nullable=False),
        sa.Column('model', sa.String(length=60), nullable=False, server_default=''),
        sa.Column('cached', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('tokens_in', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tokens_out', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('latency_ms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error', sa.String(length=500), nullable=False, server_default=''),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_ai_call_log_user_id'), 'ai_call_log', ['user_id'], unique=False)
    op.create_index(op.f('ix_ai_call_log_route'), 'ai_call_log', ['route'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ai_call_log_route'), table_name='ai_call_log')
    op.drop_index(op.f('ix_ai_call_log_user_id'), table_name='ai_call_log')
    op.drop_table('ai_call_log')
