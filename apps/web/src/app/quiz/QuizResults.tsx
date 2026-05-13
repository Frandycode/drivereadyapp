/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { CheckCircle, XCircle, SkipForward, Lightbulb, RotateCcw, Home, TrendingUp } from 'lucide-react'
import { GiChessPawn, GiChessKnight, GiChessKing } from 'react-icons/gi'

interface AnswerRecord {
  questionId: string
  questionText: string
  isCorrect: boolean
  skipped: boolean
  hintUsed: boolean
  chapter: number
}

interface QuizResultsProps {
  score: number
  total: number
  skipped: number
  hintsUsed: number
  xpEarned: number
  difficulty: 'pawn' | 'rogue' | 'king'
  deckName: string
  answers: AnswerRecord[]
  onRetry: () => void
  onExit: () => void
}

const DIFFICULTY_META: Record<
  QuizResultsProps['difficulty'],
  { label: string; Icon: React.ElementType; classes: string }
> = {
  pawn:  { label: 'Pawn',   Icon: GiChessPawn,   classes: 'text-bronze-500 bg-bronze-500/10 border-bronze-600/40' },
  rogue: { label: 'Knight', Icon: GiChessKnight, classes: 'text-silver-400 bg-silver-500/10 border-silver-600/40' },
  king:  { label: 'King',   Icon: GiChessKing,   classes: 'text-yellow bg-yellow-soft border-yellow-rim' },
}

export function QuizResults({
  score,
  total,
  skipped,
  hintsUsed,
  xpEarned,
  difficulty,
  deckName,
  answers,
  onRetry,
  onExit,
}: QuizResultsProps) {
  const answered = total - skipped
  const pct = answered > 0 ? Math.round((score / answered) * 100) : 0

  const grade =
    pct >= 90 ? { label: 'Excellent!',     tone: 'text-correct' } :
    pct >= 75 ? { label: 'Great job!',     tone: 'text-correct' } :
    pct >= 60 ? { label: 'Good effort',    tone: 'text-yellow'  } :
                { label: 'Keep practicing', tone: 'text-orange'  }

  const ringColor =
    pct >= 75 ? '#22C55E' : pct >= 60 ? '#F8DE22' : '#F45B26'

  const wrongAnswers = answers.filter((a) => !a.isCorrect && !a.skipped)
  const growthChapters = [...new Set(wrongAnswers.map((a) => a.chapter))].sort((a, b) => a - b)
  const diff = DIFFICULTY_META[difficulty]

  return (
    <div className="min-h-dvh bg-navy-deep blueprint-grid pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden px-4 pt-10 pb-8 text-center max-w-[760px] mx-auto">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background:
              'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
          }}
        />
        <div className="w-14 h-14 rounded-full bg-green-soft border border-correct/30 flex items-center justify-center mx-auto mb-5 animate-fade-up">
          <CheckCircle size={26} className="text-correct" strokeWidth={2.5} />
        </div>

        <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
          <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
          Quiz complete · {deckName}
        </div>

        <h2 className={`display font-extrabold text-[clamp(32px,5vw,48px)] leading-[1.02] tracking-[-1px] mb-2 ${grade.tone}`}>
          {grade.label}
        </h2>
        <p className="text-text-secondary text-sm mb-4">
          <span className="mono text-white font-bold">{score}</span> correct out of{' '}
          <span className="mono text-white font-bold">{answered}</span> answered
        </p>

        <span
          className={`inline-flex items-center gap-1.5 mono text-[10px] font-medium tracking-[0.08em] uppercase px-2 py-1 rounded-md border ${diff.classes}`}
        >
          <diff.Icon size={11} />
          {diff.label}
        </span>
      </div>

      <div className="px-4 max-w-[760px] mx-auto space-y-3">

        {/* Score ring + stats */}
        <div className="card flex items-center gap-6">
          {/* Ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={ringColor} strokeWidth="9"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center mono font-bold text-[20px] tabular-nums ${grade.tone}`}>
              {pct}%
            </span>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-correct">
                <CheckCircle size={14} /> Correct
              </span>
              <span className="mono font-bold text-correct tabular-nums">{score}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-wrong">
                <XCircle size={14} /> Wrong
              </span>
              <span className="mono font-bold text-wrong tabular-nums">{answered - score}</span>
            </div>
            {skipped > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <SkipForward size={14} /> Skipped
                </span>
                <span className="mono font-bold text-text-secondary tabular-nums">{skipped}</span>
              </div>
            )}
            {hintsUsed > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-yellow">
                  <Lightbulb size={14} /> Hints used
                </span>
                <span className="mono font-bold text-yellow tabular-nums">{hintsUsed}</span>
              </div>
            )}
          </div>
        </div>

        {/* XP earned */}
        {xpEarned > 0 && (
          <div className="card border-yellow-rim bg-yellow-soft flex items-center justify-between">
            <span className="mono text-[10px] font-semibold tracking-[0.12em] uppercase text-yellow">XP Earned</span>
            <span className="mono font-bold text-yellow text-xl tabular-nums">+{xpEarned}</span>
          </div>
        )}

        {/* Growth Areas */}
        {growthChapters.length > 0 && (
          <div className="card">
            <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <TrendingUp size={12} />
              Growth areas
            </div>
            <p className="text-[13px] text-text-secondary mb-3 leading-relaxed">
              Review these chapters to bring your score up.
            </p>
            <div className="flex flex-wrap gap-2">
              {growthChapters.map((ch) => (
                <span
                  key={ch}
                  className="inline-flex items-center gap-1 mono text-[10px] tracking-[0.08em] uppercase px-2 py-1 rounded-md bg-orange-soft border border-orange/30 text-orange font-medium"
                >
                  Ch. {String(ch).padStart(2, '0')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missed questions list */}
        {wrongAnswers.length > 0 && (
          <div className="card">
            <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-wrong">
              <span className="w-[14px] h-[1.5px] rounded-full bg-wrong" />
              Missed · {wrongAnswers.length}
            </div>
            <div className="space-y-2.5">
              {wrongAnswers.map((a) => (
                <div key={a.questionId} className="flex items-start gap-2.5 py-1.5 border-b border-white/[0.04] last:border-b-0">
                  <XCircle size={14} className="text-wrong flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-text-primary leading-relaxed mb-0.5">
                      {a.questionText}
                    </p>
                    <span className="mono text-[10px] tracking-[0.08em] uppercase text-text-muted">
                      Ch. {String(a.chapter).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-3">
          <button
            onClick={onRetry}
            className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <RotateCcw size={16} />
            Try Again
          </button>
          <button
            onClick={onExit}
            className="btn-secondary w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Home size={16} />
            Back to Learn
          </button>
        </div>
      </div>
    </div>
  )
}
