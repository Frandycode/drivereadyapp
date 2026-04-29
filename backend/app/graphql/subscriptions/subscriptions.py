# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import asyncio
import json
import strawberry
from typing import AsyncGenerator, Optional
from app.db.redis import get_redis


# ── Subscription payload ──────────────────────────────────────────────────────

@strawberry.type
class BattleUpdateType:
    # Core fields — always present
    event:           str            # joined | answer_submitted | battle_end |
                                    # forfeit | draw_requested | draw_accepted |
                                    # draw_declined | screen_leave | screen_return |
                                    # auto_defeat | heartbeat_lost
    player_id:       str            # user who triggered this event
    question_index:  int
    is_correct:      Optional[bool]
    player_score:    int
    opponent_score:  int
    battle_state:    str            # waiting | active | complete
    winner:          Optional[str]  # player | opponent | tie | None

    # Draw request tracking
    draw_requests_used:   Optional[int]  # how many draws the acting player has used (0–2)
    draw_requests_left:   Optional[int]  # remaining draw requests for acting player

    # Screen leave tracking
    screen_leave_strikes: Optional[int]  # current strike count for acting player
    was_forgiven:         Optional[bool] # True if leave was < 5s (no strike applied)
    duration_away_ms:     Optional[int]  # how long the player was off screen


# ── Subscription class ────────────────────────────────────────────────────────

@strawberry.type
class Subscription:

    @strawberry.subscription
    async def battle_updated(
        self,
        info: strawberry.types.Info,
        battle_id: strawberry.ID,
    ) -> AsyncGenerator[BattleUpdateType, None]:
        """
        Subscribe to real-time updates for a peer battle room.
        Uses Redis pub/sub channel: battle:{battle_id}

        Events emitted:
          joined            → opponent joined the room
          answer_submitted  → a player submitted an answer
          battle_end        → all questions answered by both players
          forfeit           → a player manually forfeited
          draw_requested    → a player requested a draw
          draw_accepted     → opponent accepted the draw (tie)
          draw_declined     → opponent declined the draw
          screen_leave      → a player left the game screen
          screen_return     → a player returned to the game screen
          auto_defeat       → player lost due to 3rd screen leave or timeout
          heartbeat_lost    → player disconnected (heartbeat stopped)
        """
        channel = f"battle:{str(battle_id)}"
        redis   = await get_redis()
        pubsub  = redis.pubsub()
        await pubsub.subscribe(channel)

        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True)
                if message and message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        yield BattleUpdateType(
                            event=data.get("event", ""),
                            player_id=data.get("player_id", ""),
                            question_index=data.get("question_index", 0),
                            is_correct=data.get("is_correct"),
                            player_score=data.get("player_score", 0),
                            opponent_score=data.get("opponent_score", 0),
                            battle_state=data.get("battle_state", "active"),
                            winner=data.get("winner"),
                            draw_requests_used=data.get("draw_requests_used"),
                            draw_requests_left=data.get("draw_requests_left"),
                            screen_leave_strikes=data.get("screen_leave_strikes"),
                            was_forgiven=data.get("was_forgiven"),
                            duration_away_ms=data.get("duration_away_ms"),
                        )
                    except (json.JSONDecodeError, KeyError):
                        pass
                await asyncio.sleep(0.05)   # 50ms poll — low latency without busy loop
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()
