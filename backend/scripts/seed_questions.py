# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""
Seed the database with initial Oklahoma questions and achievements.
Run: python scripts/seed_questions.py

Uses the questions extracted from the Oklahoma Driver Manual.
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config import settings
from app.models import Base, Question, Answer, Achievement

# ── Sample questions (replace with full bank from AI generation) ─────────────
QUESTIONS = [
    {
        "state_code": "ok", "chapter": 4, "category": "regulatory",
        "difficulty": "pawn",
        "question_text": "What does a red octagonal sign indicate?",
        "correct_count": 1,
        "explanation": "A red octagon is always a STOP sign. You must come to a complete stop.",
        "hint_text": "Focus on the shape — octagons are exclusive to one sign type.",
        "source_page": 42, "tags": ["signs", "regulatory"],
        "answers": [
            {"text": "Stop completely", "is_correct": True},
            {"text": "Yield to cross traffic", "is_correct": False},
            {"text": "Speed limit ahead", "is_correct": False},
            {"text": "Railroad crossing", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 4, "category": "warning",
        "difficulty": "pawn",
        "question_text": "A yellow diamond-shaped sign warns of what?",
        "correct_count": 1,
        "explanation": "Yellow diamond signs warn drivers of upcoming hazards or changing road conditions.",
        "hint_text": "Yellow = caution. Diamond = warning.",
        "source_page": 44, "tags": ["signs", "warning"],
        "answers": [
            {"text": "A hazard or change in road conditions", "is_correct": True},
            {"text": "A school zone ahead", "is_correct": False},
            {"text": "A mandatory stop", "is_correct": False},
            {"text": "A speed limit change", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 5, "category": "right_of_way",
        "difficulty": "rogue",
        "question_text": "At an uncontrolled intersection, who has the right of way?",
        "correct_count": 1,
        "explanation": "At an uncontrolled intersection, the vehicle that arrives first has right of way. If arriving simultaneously, yield to the vehicle on the right.",
        "hint_text": "Think: first to arrive, OR if tied — which side?",
        "source_page": 56, "tags": ["right_of_way", "intersections"],
        "answers": [
            {"text": "The vehicle that arrived first, or the vehicle to the right if simultaneous", "is_correct": True},
            {"text": "The vehicle traveling on the larger road", "is_correct": False},
            {"text": "The vehicle going straight (not turning)", "is_correct": False},
            {"text": "The vehicle on the left", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 6, "category": "speed",
        "difficulty": "pawn",
        "question_text": "What is the standard speed limit in a residential area in Oklahoma unless otherwise posted?",
        "correct_count": 1,
        "explanation": "Oklahoma's default residential speed limit is 25 mph unless signs indicate otherwise.",
        "hint_text": "Think neighborhood streets — lower than a highway, higher than a school zone.",
        "source_page": 62, "tags": ["speed_limits"],
        "answers": [
            {"text": "25 mph", "is_correct": True},
            {"text": "30 mph", "is_correct": False},
            {"text": "20 mph", "is_correct": False},
            {"text": "35 mph", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 6, "category": "speed",
        "difficulty": "pawn",
        "question_text": "What is the speed limit in a school zone when children are present in Oklahoma?",
        "correct_count": 1,
        "explanation": "School zones in Oklahoma have a 25 mph limit when children are present or when the school zone flasher is active.",
        "hint_text": "This matches the residential limit — slow for safety.",
        "source_page": 63, "tags": ["speed_limits", "school_zone"],
        "answers": [
            {"text": "25 mph", "is_correct": True},
            {"text": "15 mph", "is_correct": False},
            {"text": "20 mph", "is_correct": False},
            {"text": "30 mph", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 7, "category": "signals",
        "difficulty": "pawn",
        "question_text": "What must you do when approaching a flashing red traffic light?",
        "correct_count": 1,
        "explanation": "A flashing red light is treated the same as a stop sign — come to a complete stop, then proceed when safe.",
        "hint_text": "Flashing red = treat it like a familiar sign with the same color.",
        "source_page": 71, "tags": ["signals", "intersections"],
        "answers": [
            {"text": "Stop completely, then proceed when safe", "is_correct": True},
            {"text": "Slow down and proceed with caution", "is_correct": False},
            {"text": "Yield to cross traffic only", "is_correct": False},
            {"text": "Stop and wait for the light to turn green", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 7, "category": "signals",
        "difficulty": "pawn",
        "question_text": "What does a flashing yellow traffic light mean?",
        "correct_count": 1,
        "explanation": "A flashing yellow light means slow down and proceed with caution — you do not need to stop.",
        "hint_text": "Yellow means caution, flashing means it's ongoing — not a full stop.",
        "source_page": 71, "tags": ["signals"],
        "answers": [
            {"text": "Slow down and proceed with caution", "is_correct": True},
            {"text": "Stop and wait", "is_correct": False},
            {"text": "Come to a complete stop", "is_correct": False},
            {"text": "Prepare to stop", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 8, "category": "passing",
        "difficulty": "rogue",
        "question_text": "Which of the following situations makes passing another vehicle illegal in Oklahoma?",
        "correct_count": 1,
        "explanation": "Passing is illegal on hills, curves, intersections, and railroad crossings where visibility is limited.",
        "hint_text": "Think about where you cannot see far enough ahead.",
        "source_page": 80, "tags": ["passing", "safety"],
        "answers": [
            {"text": "On a hill where you cannot see oncoming traffic", "is_correct": True},
            {"text": "On a straight road with a dashed center line", "is_correct": False},
            {"text": "When the vehicle ahead is going 10 mph under the limit", "is_correct": False},
            {"text": "During daylight hours on a highway", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 9, "category": "alcohol",
        "difficulty": "rogue",
        "question_text": "What is the legal blood alcohol concentration (BAC) limit for drivers 21 and older in Oklahoma?",
        "correct_count": 1,
        "explanation": "Oklahoma's legal BAC limit is 0.08% for drivers 21 and over. Any measurable BAC for drivers under 21.",
        "hint_text": "This is the national standard in the US.",
        "source_page": 92, "tags": ["alcohol", "dui"],
        "answers": [
            {"text": "0.08%", "is_correct": True},
            {"text": "0.10%", "is_correct": False},
            {"text": "0.05%", "is_correct": False},
            {"text": "0.04%", "is_correct": False},
        ],
    },
    {
        "state_code": "ok", "chapter": 10, "category": "sharing_road",
        "difficulty": "pawn",
        "question_text": "When must you yield to pedestrians in Oklahoma?",
        "correct_count": 1,
        "explanation": "You must always yield to pedestrians in marked or unmarked crosswalks.",
        "hint_text": "Pedestrians on foot always have priority over vehicles when crossing legally.",
        "source_page": 101, "tags": ["pedestrians", "right_of_way"],
        "answers": [
            {"text": "Whenever they are in a marked or unmarked crosswalk", "is_correct": True},
            {"text": "Only when traffic lights are not present", "is_correct": False},
            {"text": "Only in school zones", "is_correct": False},
            {"text": "Only when they have the walk signal", "is_correct": False},
        ],
    },
]

ACHIEVEMENTS = [
    {"key": "first_flip",     "name": "First Flip",      "description": "Complete your first flashcard session",       "icon": "layers",    "xp_reward": 10},
    {"key": "chapter_1",      "name": "Chapter 1 Clear", "description": "Complete Chapter 1 lessons and pop quiz",     "icon": "book-open", "xp_reward": 20},
    {"key": "all_clear",      "name": "All Clear",       "description": "Complete all 12 chapters",                    "icon": "award",     "xp_reward": 200},
    {"key": "ace",            "name": "Ace",             "description": "Score 100% on any assessment",                "icon": "star",      "xp_reward": 50},
    {"key": "speed_demon",    "name": "Speed Demon",     "description": "Complete Timer Blitz with 20+ cards",         "icon": "zap",       "xp_reward": 30},
    {"key": "beat_rusty",     "name": "Bot Slayer — Rusty", "description": "Beat Rusty in a Robot Battle",             "icon": "bot",       "xp_reward": 20},
    {"key": "beat_dash",      "name": "Bot Slayer — Dash",  "description": "Beat Dash in a Robot Battle",              "icon": "bot",       "xp_reward": 40},
    {"key": "beat_apex",      "name": "Bot Slayer — Apex",  "description": "Beat Apex in a Robot Battle",              "icon": "bot",       "xp_reward": 100},
    {"key": "streak_7",       "name": "On Fire",         "description": "Maintain a 7-day study streak",               "icon": "flame",     "xp_reward": 50},
    {"key": "streak_30",      "name": "Unstoppable",     "description": "Maintain a 30-day study streak",              "icon": "flame",     "xp_reward": 200},
    {"key": "scholar",        "name": "Scholar",         "description": "Reach 1000 total XP",                         "icon": "graduation-cap", "xp_reward": 50},
    {"key": "road_ready",     "name": "Road Ready",      "description": "Reach a readiness score above 85%",           "icon": "target",    "xp_reward": 100},
    {"key": "night_owl",      "name": "Night Owl",       "description": "Complete Night Before Mode",                  "icon": "moon",      "xp_reward": 30},
    {"key": "bookworm",       "name": "Bookworm",        "description": "Save 50 bookmarks",                           "icon": "bookmark",  "xp_reward": 25},
    {"key": "deck_builder",   "name": "Deck Builder",    "description": "Create a custom saved deck",                  "icon": "layers",    "xp_reward": 15},
    {"key": "peer_crusher",   "name": "Peer Crusher",    "description": "Win 5 peer battles",                          "icon": "swords",    "xp_reward": 75},
    {"key": "trivia_master",  "name": "Trivia Master",   "description": "Complete 10 Trivia sessions",                 "icon": "help-circle", "xp_reward": 40},
]


async def seed():
    engine = create_async_engine(settings.database_url, echo=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        # Seed questions
        print(f"Seeding {len(QUESTIONS)} questions...")
        for q_data in QUESTIONS:
            answers_data = q_data.pop("answers")
            question = Question(**q_data)
            session.add(question)
            await session.flush()

            for i, a_data in enumerate(answers_data):
                answer = Answer(question_id=question.id, sort_order=i, **a_data)
                session.add(answer)

        # Seed achievements
        print(f"Seeding {len(ACHIEVEMENTS)} achievements...")
        for a_data in ACHIEVEMENTS:
            achievement = Achievement(**a_data)
            session.add(achievement)

        await session.commit()
        print("✓ Seed complete")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
