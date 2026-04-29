# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.connection import Base
from .base import UUIDMixin, TimestampMixin


class PlayerBehaviorLog(Base, UUIDMixin):
    """
    Append-only event log for in-battle player behavior.

    Recorded events:
      forfeit | screen_leave | screen_return | auto_defeat
      draw_requested | draw_accepted | draw_declined | disconnect

    leave_reason is always "unknown" on web; mobile will set "phone_call"
    when a native CallKit / PhoneStateListener interrupt is detected.
    """
    __tablename__ = "player_behavior_log"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    battle_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("battles.id", ondelete="SET NULL"), index=True
    )
    event_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    detail: Mapped[dict | None] = mapped_column(JSONB)
    leave_reason: Mapped[str | None] = mapped_column(String(20))  # unknown | phone_call
    was_forgiven: Mapped[bool | None] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    battle: Mapped["Battle | None"] = relationship(foreign_keys=[battle_id])


class PlayerStats(Base, UUIDMixin, TimestampMixin):
    """
    One row per user — rolling lifetime stats, reputation, rank, and ban state.

    Reputation starts at 100 and changes per the architecture spec:
      forfeit: -5 | screen leave strike: -3 | draw request used: -2
      auto-defeat (disconnect): -10 | clean game: +2 | 24h clean play: +1

    Reputation tracks on four independent rails:
      original   → never changes (starting baseline)
      gold       → fresh start when first reaching Gold rank
      diamond    → fresh start when first reaching Diamond rank
      all_time   → never resets, the unforgiving truth

    Columns marked admin-only are excluded from player-facing queries.
    """
    __tablename__ = "player_stats"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_player_stats_user"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # ── Game outcomes ──────────────────────────────────────────────────────────
    games_played:    Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    games_won:       Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    games_lost:      Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    games_tied:      Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    games_forfeited: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── Draw requests ──────────────────────────────────────────────────────────
    draw_requests_sent:     Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    draw_requests_accepted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── Behavior counts ────────────────────────────────────────────────────────
    screen_leave_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    disconnect_count:   Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── Reputation ─────────────────────────────────────────────────────────────
    reputation_score:    Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    reputation_original: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    reputation_gold:     Mapped[int | None] = mapped_column(Integer)  # set on first Gold
    reputation_diamond:  Mapped[int | None] = mapped_column(Integer)  # set on first Diamond
    reputation_all_time: Mapped[int] = mapped_column(Integer, nullable=False, default=100)

    # ── Rank ───────────────────────────────────────────────────────────────────
    game_rank: Mapped[str] = mapped_column(
        String(10), nullable=False, default="bronze"
    )  # bronze | silver | gold | platinum | diamond

    # ── Bans ───────────────────────────────────────────────────────────────────
    ban_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ban_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_banned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # ── Admin-only ─────────────────────────────────────────────────────────────
    total_play_time_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_session_duration_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(foreign_keys=[user_id])


# Import here to avoid circular imports
from .user import User      # noqa: E402, F401
from .session import Battle # noqa: E402, F401
