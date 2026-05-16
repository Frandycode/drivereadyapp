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

import { useState } from 'react'
import {
  FiBookOpen,
  FiLayers,
  FiZap,
  FiArrowRight,
  FiCheck,
  FiTarget,
  FiAward,
} from 'react-icons/fi'
import { GiRobotGolem } from 'react-icons/gi'
import { RiSparklingFill } from 'react-icons/ri'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { IconType } from 'react-icons'

interface Step {
  Icon: IconType
  title: string
  body: string
  accent: 'orange' | 'yellow' | 'green'
}

const STEPS: Step[] = [
  {
    Icon: FiBookOpen,
    title: 'Learn one chapter at a time',
    body:
      'Twelve chapters covering every section of the Oklahoma driver manual. Read each lesson, then take the short pop quiz to lock the rule in.',
    accent: 'orange',
  },
  {
    Icon: FiLayers,
    title: 'Study however suits you',
    body:
      'Flashcards, drills, and adaptive practice — the questions you keep missing show up more often until you nail them.',
    accent: 'yellow',
  },
  {
    Icon: FiZap,
    title: 'Challenge yourself',
    body:
      'Quizzes, puzzles, trivia, and timed runs. XP and streaks keep your momentum honest. The harder the mode, the bigger the multiplier.',
    accent: 'orange',
  },
  {
    Icon: GiRobotGolem,
    title: 'Battle an AI opponent',
    body:
      'Three bots, three skill levels — Rusty, Dash, and Apex. Real LLM-driven reasoning, so the trash talk is earned.',
    accent: 'yellow',
  },
  {
    Icon: RiSparklingFill,
    title: 'Ask DriveReady anything',
    body:
      'Tap "Ask DriveReady" on the home page to chat about any traffic rule, road sign, or test concept. Scoped to driving — no off-topic detours.',
    accent: 'orange',
  },
  {
    Icon: FiTarget,
    title: 'Take the mock exam when ready',
    body:
      '50 questions, 60-minute timer, 38 to pass. Mirrors the real DMV format, ends with personalized AI coaching on your weak spots.',
    accent: 'yellow',
  },
  {
    Icon: FiAward,
    title: 'Drive ready',
    body:
      "Pass the exam in-app, walk into the DMV confident. You'll know the rules cold — not just the answers.",
    accent: 'green',
  },
]

const ACCENT_RING: Record<Step['accent'], string> = {
  orange: 'bg-orange-soft border-orange/30 text-orange',
  yellow: 'bg-yellow-soft border-yellow-rim text-yellow',
  green:  'bg-green-soft border-green/30 text-green-400',
}

interface OnboardingTutorialSheetProps {
  open: boolean
  onClose: () => void
}

export function OnboardingTutorialSheet({ open, onClose }: OnboardingTutorialSheetProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1

  function next() {
    if (isLast) {
      onClose()
      setStepIdx(0)
    } else {
      setStepIdx((i) => i + 1)
    }
  }
  return (
    <BottomSheet
      open={open}
      onClose={() => {
        onClose()
        setStepIdx(0)
      }}
      title="How DriveReady works"
      size="tall"
    >
      <div className="flex flex-col">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === stepIdx ? 'bg-orange' : i < stepIdx ? 'bg-orange/45' : 'bg-surface-3'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="flex flex-col items-center text-center min-h-[260px]">
          <div
            className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-5 ${ACCENT_RING[step.accent]}`}
          >
            <step.Icon size={28} />
          </div>

          <h3 className="display font-extrabold text-xl text-white mb-2 leading-tight">
            {step.title}
          </h3>

          <p className="text-text-secondary text-sm leading-relaxed max-w-[440px]">
            {step.body}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 mt-6 pb-2">
          <button
            onClick={() => {
              onClose()
              setStepIdx(0)
            }}
            className="text-sm text-text-secondary hover:text-white transition-colors"
          >
            Skip
          </button>

          <div className="mono text-[10px] text-text-muted tracking-widest">
            {String(stepIdx + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          </div>

          <button
            onClick={next}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm"
          >
            {isLast ? (
              <>
                Got it
                <FiCheck size={14} />
              </>
            ) : (
              <>
                Next
                <FiArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
