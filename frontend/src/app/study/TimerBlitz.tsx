import { useState, useEffect, useRef } from 'react'
import { FlashCard } from './FlashCard'
import { X, Zap } from 'lucide-react'

interface Question {
  id: string
  questionText: string
  explanation: string
  hintText?: string
}

interface TimerBlitzProps {
  questions: Question[]
  deckName: string
  seconds: number
  onExit: () => void
  onComplete: (flipped: number, total: number) => void
}

export function TimerBlitz({ questions, deckName, seconds, onExit, onComplete }: TimerBlitzProps) {
  const [started, setStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [flippedCount, setFlippedCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Shuffle questions for blitz
  const [shuffled] = useState(() => [...questions].sort(() => Math.random() - 0.5))

  useEffect(() => {
    if (!started) return

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current!)
  }, [started])

  // When time hits 0, finish
  useEffect(() => {
    if (timeLeft === 0 && started) {
      onComplete(flippedCount, shuffled.length)
    }
  }, [timeLeft, started])

  function handleFlip() {
    if (!started) return
    setFlipped((f) => {
      const next = !f
      if (next) setFlippedCount((c) => c + 1)
      return next
    })
  }

  function handleNext() {
    if (!started) return
    setFlipped(false)
    setTimeout(() => {
      setIndex((i) => (i + 1) % shuffled.length)
    }, 100)
  }

  // Timer color
  const pct = timeLeft / seconds
  const timerColor =
    pct > 0.5 ? 'text-green-500' : pct > 0.2 ? 'text-gold-500' : 'text-red-400'
  const timerPulse = pct <= 0.1 && started

  const current = shuffled[index % shuffled.length]

  if (!started) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 text-center">
        <button
          onClick={onExit}
          className="absolute top-4 left-4 p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-700 flex items-center justify-center mb-6">
          <Zap size={28} className="text-green-500" />
        </div>

        <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Timer Blitz</h2>
        <p className="text-text-secondary text-sm mb-1">{deckName}</p>
        <p className="text-text-secondary text-sm mb-8">
          Flip as many cards as you can in{' '}
          <span className="text-green-500 font-mono font-bold">{seconds}s</span>
        </p>

        <button
          onClick={() => setStarted(true)}
          className="btn-primary w-full max-w-xs h-12 text-base font-semibold"
        >
          Start!
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/90 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-content mx-auto">
          <button
            onClick={onExit}
            className="p-1 -ml-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-secondary font-medium truncate">{deckName}</p>
              <span className="text-xs text-text-secondary font-mono">
                {flippedCount} flipped
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center pt-6 pb-2">
        <div className={`font-mono font-bold text-5xl ${timerColor} ${timerPulse ? 'animate-pulse' : ''} tabular-nums`}>
          {timeLeft}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4 max-w-content mx-auto w-full">
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              pct > 0.5 ? 'bg-green-500' : pct > 0.2 ? 'bg-gold-500' : 'bg-red-500'
            }`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-6 max-w-content mx-auto w-full">
        <FlashCard
          question={current.questionText}
          answer={current.explanation}
          hint={current.hintText}
          flipped={flipped}
          onFlip={handleFlip}
        />

        {/* Next button — only shown after flip */}
        <div className="mt-4">
          {flipped ? (
            <button
              onClick={handleNext}
              className="btn-primary w-full"
            >
              Next Card →
            </button>
          ) : (
            <p className="text-center text-xs text-text-secondary">Tap card to flip</p>
          )}
        </div>
      </div>
    </div>
  )
}
