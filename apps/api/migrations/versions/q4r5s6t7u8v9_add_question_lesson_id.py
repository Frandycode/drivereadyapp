# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""nullable Question.lesson_id FK for question-to-lesson linkage

Revision ID: q4r5s6t7u8v9
Revises: p3q4r5s6t7u8
Create Date: 2026-05-12
"""

from alembic import op
import sqlalchemy as sa

revision = 'q4r5s6t7u8v9'
down_revision = 'p3q4r5s6t7u8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'questions',
        sa.Column('lesson_id', sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        'fk_questions_lesson_id',
        'questions',
        'lessons',
        ['lesson_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_index(op.f('ix_questions_lesson_id'), 'questions', ['lesson_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_questions_lesson_id'), table_name='questions')
    op.drop_constraint('fk_questions_lesson_id', 'questions', type_='foreignkey')
    op.drop_column('questions', 'lesson_id')
