// ── State codes ───────────────────────────────────────────────────────────────
// Extend as new states are added to the platform.
export type StateCode = 'ok' | 'tx' | 'ca' | 'fl' | 'ny'

// ── Common enums ──────────────────────────────────────────────────────────────
export type UserRole  = 'learner' | 'parent' | 'admin'
export type Difficulty = 'pawn' | 'rogue' | 'king'
export type StudyMode  = 'free' | 'drill' | 'blitz'
export type BattleType = 'bot' | 'peer'
export type BattleState = 'waiting' | 'active' | 'complete'
