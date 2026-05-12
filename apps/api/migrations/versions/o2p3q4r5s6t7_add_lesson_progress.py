# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""lesson_progress — per-user lesson read + quiz state

Revision ID: o2p3q4r5s6t7
Revises: n1o2p3q4r5s6
Create Date: 2026-05-12
"""

from alembic import op
import sqlalchemy as sa

revision = 'o2p3q4r5s6t7'
down_revision = 'n1o2p3q4r5s6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'lesson_progress',
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('lesson_id', sa.Uuid(), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('quiz_completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'lesson_id', name='uq_lesson_progress_user_lesson'),
    )
    op.create_index(op.f('ix_lesson_progress_user_id'), 'lesson_progress', ['user_id'], unique=False)
    op.create_index(op.f('ix_lesson_progress_lesson_id'), 'lesson_progress', ['lesson_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_lesson_progress_lesson_id'), table_name='lesson_progress')
    op.drop_index(op.f('ix_lesson_progress_user_id'), table_name='lesson_progress')
    op.drop_table('lesson_progress')
