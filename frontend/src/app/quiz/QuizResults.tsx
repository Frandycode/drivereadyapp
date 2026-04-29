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
    pct >= 90 ? { label: 'Excellent!', color: 'text-green-400' } :
    pct >= 75 ? { label: 'Great job!', color: 'text-green-500' } :
    pct >= 60 ? { label: 'Good effort', color: 'text-gold-500' } :
    { label: 'Keep practicing', color: 'text-red-400' }

  const wrongAnswers = answers.filter((a) => !a.isCorrect && !a.skipped)
  const skippedAnswers = answers.filter((a) => a.skipped)

  // Group wrong answers by chapter for Growth Areas
  const growthChapters = [...new Set(wrongAnswers.map((a) => a.chapter))].sort()

  return (
    <div className="min-h-dvh bg-bg pb-8">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 text-center max-w-content mx-auto">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-1">
          {deckName}
        </p>
        <h2 className={`font-display text-3xl font-bold mb-1 ${grade.color}`}>
          {grade.label}
        </h2>
        <p className="text-text-secondary text-sm">
          {score} correct out of {answered} answered
        </p>
      </div>

      <div className="px-4 max-w-content mx-auto space-y-4">

        {/* Score ring + stats */}
        <div className="card flex items-center gap-6">
          {/* Ring */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#243D29" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="38" fill="none"
                stroke="#22C55E" strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - pct / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg text-text-primary">
              {pct}%
            </span>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-green-400">
                <CheckCircle size={14} /> Correct
              </span>
              <span className="font-mono font-medium text-green-400">{score}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-red-400">
                <XCircle size={14} /> Wrong
              </span>
              <span className="font-mono font-medium text-red-400">{answered - score}</span>
            </div>
            {skipped > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <SkipForward size={14} /> Skipped
                </span>
                <span className="font-mono font-medium text-text-secondary">{skipped}</span>
              </div>
            )}
            {hintsUsed > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gold-500">
                  <Lightbulb size={14} /> Hints used
                </span>
                <span className="font-mono font-medium text-gold-500">{hintsUsed}</span>
              </div>
            )}
          </div>
        </div>

        {/* XP earned */}
        {xpEarned > 0 && (
          <div className="card border-gold-600/30 flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">XP Earned</span>
            <span className="font-mono font-bold text-gold-500 text-lg">+{xpEarned} XP</span>
          </div>
        )}

        {/* Growth Areas */}
        {growthChapters.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-gold-500" />
              <h3 className="text-sm font-medium text-text-primary">Growth Areas</h3>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Review these chapters to improve your score:
            </p>
            <div className="flex flex-wrap gap-2">
              {growthChapters.map((ch) => (
                <span
                  key={ch}
                  className="px-2.5 py-1 bg-gold-500/10 border border-gold-600/30 rounded-full text-xs text-gold-500 font-medium"
                >
                  Chapter {ch}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missed questions list */}
        {wrongAnswers.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Missed Questions ({wrongAnswers.length})
            </h3>
            <div className="space-y-2">
              {wrongAnswers.map((a) => (
                <div key={a.questionId} className="flex items-start gap-2">
                  <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {a.questionText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onRetry}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Try Again
          </button>
          <button
            onClick={onExit}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Back to Learn
          </button>
        </div>
      </div>
    </div>
  )
}
