# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import strawberry
from datetime import datetime, date
from typing import Optional


@strawberry.type
class AnswerType:
    id: strawberry.ID
    text: str
    is_correct: bool
    sort_order: int


@strawberry.type
class QuestionType:
    id: strawberry.ID
    state_code: str
    chapter: int
    category: str
    difficulty: str
    question_text: str
    correct_count: int
    explanation: str
    hint_text: Optional[str]
    image_url: Optional[str]
    source_page: Optional[int]
    tags: list[str]
    source: str
    answers: list[AnswerType]


@strawberry.type
class ChapterType:
    id: strawberry.ID
    state_code: str
    number: int
    title: str
    description: Optional[str]


@strawberry.type
class LessonType:
    id: strawberry.ID
    chapter_id: strawberry.ID
    sort_order: int
    title: Optional[str]
    content: str
    image_url: Optional[str]
    fact_tags: list[str]


@strawberry.type
class UserType:
    id: strawberry.ID
    email: str
    display_name: str
    avatar_url: Optional[str]
    role: str
    state_code: str
    xp_total: int
    level: int
    streak_days: int
    freeze_tokens: int
    test_date: Optional[date]
    created_at: datetime
    email_verified: bool
    phone_number: Optional[str]
    phone_verified: bool


@strawberry.type
class ChapterProgressType:
    chapter: int
    state_code: str
    questions_seen: int
    questions_correct: int
    accuracy: float
    lessons_completed: int
    lessons_total: int
    last_studied_at: Optional[datetime]

    @strawberry.field
    def is_growth_area(self) -> bool:
        """Chapters below 65% accuracy are growth areas."""
        return self.questions_seen > 0 and self.accuracy < 0.65


@strawberry.type
class ReadinessScoreType:
    score: float           # 0.0 - 1.0
    percentage: int        # 0 - 100
    level: str             # not_ready | getting_there | likely_ready | very_ready
    message: str
    growth_chapters: list[int]


@strawberry.type
class BookmarkType:
    id: strawberry.ID
    question_id: Optional[strawberry.ID]
    lesson_id: Optional[strawberry.ID]
    note: Optional[str]
    created_at: datetime


@strawberry.type
class AchievementType:
    id: strawberry.ID
    key: str
    name: str
    description: str
    icon: str
    xp_reward: int


@strawberry.type
class UserAchievementType:
    achievement: AchievementType
    earned_at: datetime


@strawberry.type
class FlashcardDeckType:
    id: strawberry.ID
    name: str
    question_ids: list[str]
    is_smart: bool
    created_at: datetime
    updated_at: datetime


@strawberry.type
class ChapterGroupType:
    id: strawberry.ID
    name: str
    state_code: str
    chapter_numbers: list[int]
    is_preset: bool
    created_at: datetime


@strawberry.type
class SessionType:
    id: strawberry.ID
    mode: str
    difficulty: str
    question_count: int
    score: int
    total: int
    xp_earned: int
    completed: bool
    started_at: datetime
    completed_at: Optional[datetime]


@strawberry.type
class SessionResultType:
    session: SessionType
    xp_earned: int
    badges_unlocked: list[AchievementType]
    level_up: bool
    new_level: Optional[int]
    accuracy: float


@strawberry.type
class AnswerResultType:
    is_correct: bool
    correct_answer_ids: list[strawberry.ID]
    explanation: str
    xp_earned: int


@strawberry.type
class BattleType:
    id: strawberry.ID
    type: str
    player_id: strawberry.ID
    opponent_id: Optional[strawberry.ID]
    bot_type: Optional[str]
    player_score: int
    opponent_score: int
    winner: Optional[str]
    state: str
    question_ids: list[str]
    room_code: Optional[str]
    timer_seconds: Optional[int]
    chapter_ids: list[int]
    created_at: datetime


@strawberry.type
class AuthPayloadType:
    access_token: str
    user: UserType
    consent_status: str   # not_required | pending | approved
    email_verified: bool


@strawberry.type
class StateConfigType:
    code: str
    name: str
    full_name: str
    primary_color: str
    secondary_color: str
    passing_score: float
    real_test_count: int
    chapters: int


# ── Input types ───────────────────────────────────────────────────────────────

@strawberry.input
class RegisterInput:
    email: str
    password: str
    display_name: str
    date_of_birth: date
    state_code: str = "ok"
    parent_email: Optional[str] = None


@strawberry.input
class LoginInput:
    email: str
    password: str


@strawberry.input
class VerifyOtpInput:
    code: str


@strawberry.input
class SendPhoneOtpInput:
    phone_number: str


@strawberry.input
class StartSessionInput:
    mode: str
    difficulty: str
    question_count: int
    chapters: list[int]
    state_code: str = "ok"


@strawberry.input
class SubmitAnswerInput:
    session_id: strawberry.ID
    question_id: strawberry.ID
    selected_answer_ids: list[strawberry.ID]
    time_taken_ms: Optional[int] = None
    hint_used: bool = False


@strawberry.input
class CreateDeckInput:
    name: str
    question_ids: list[str]


@strawberry.input
class CreateBattleInput:
    type: str               # bot | peer
    bot_type: Optional[str] = None
    question_count: int = 10
    chapters: list[int] = strawberry.field(default_factory=list)