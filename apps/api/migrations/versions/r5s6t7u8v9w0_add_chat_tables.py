# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""chat_threads + chat_messages — AI tutor chat persistence

Revision ID: r5s6t7u8v9w0
Revises: q4r5s6t7u8v9
Create Date: 2026-05-12
"""

from alembic import op
import sqlalchemy as sa

revision = 'r5s6t7u8v9w0'
down_revision = 'q4r5s6t7u8v9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'chat_threads',
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_chat_threads_user_id'), 'chat_threads', ['user_id'], unique=False)

    op.create_table(
        'chat_messages',
        sa.Column('thread_id', sa.Uuid(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['thread_id'], ['chat_threads.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_chat_messages_thread_id'), 'chat_messages', ['thread_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_chat_messages_thread_id'), table_name='chat_messages')
    op.drop_table('chat_messages')
    op.drop_index(op.f('ix_chat_threads_user_id'), table_name='chat_threads')
    op.drop_table('chat_threads')
