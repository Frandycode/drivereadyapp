import asyncio
import json
import strawberry
from typing import AsyncGenerator, Optional
from app.db.redis import get_redis


@strawberry.type
class BattleUpdateType:
    event:           str            # joined | answer_submitted | battle_end
    player_id:       str
    question_index:  int
    is_correct:      Optional[bool]
    player_score:    int
    opponent_score:  int
    battle_state:    str            # waiting | active | complete
    winner:          Optional[str]  # player | opponent | tie | None


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
                        )
                    except (json.JSONDecodeError, KeyError):
                        pass
                await asyncio.sleep(0.05)   # 50ms poll — low latency without busy loop
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()