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
import { useMutation, gql } from '@apollo/client'
import { ChevronRight, ChevronLeft, Calendar, Loader2 } from 'lucide-react'
import { GiSteeringWheel } from 'react-icons/gi'
import { MdSentimentVeryDissatisfied, MdSentimentNeutral, MdSentimentVerySatisfied } from 'react-icons/md'
import { AppLogo } from '@/components/layout/AppLogo'
import { useUserStore } from '@/stores'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const UPDATE_PROFILE = gql`
  mutation OnboardingUpdateProfile($stateCode: String, $testDate: String) {
    updateProfile(stateCode: $stateCode, testDate: $testDate) {
      id stateCode testDate
    }
  }
`

// ── US States ─────────────────────────────────────────────────────────────────

const US_STATES = [
  { code: 'al', name: 'Alabama' },        { code: 'ak', name: 'Alaska' },
  { code: 'az', name: 'Arizona' },        { code: 'ar', name: 'Arkansas' },
  { code: 'ca', name: 'California' },     { code: 'co', name: 'Colorado' },
  { code: 'ct', name: 'Connecticut' },    { code: 'de', name: 'Delaware' },
  { code: 'fl', name: 'Florida' },        { code: 'ga', name: 'Georgia' },
  { code: 'hi', name: 'Hawaii' },         { code: 'id', name: 'Idaho' },
  { code: 'il', name: 'Illinois' },       { code: 'in', name: 'Indiana' },
  { code: 'ia', name: 'Iowa' },           { code: 'ks', name: 'Kansas' },
  { code: 'ky', name: 'Kentucky' },       { code: 'la', name: 'Louisiana' },
  { code: 'me', name: 'Maine' },          { code: 'md', name: 'Maryland' },
  { code: 'ma', name: 'Massachusetts' },  { code: 'mi', name: 'Michigan' },
  { code: 'mn', name: 'Minnesota' },      { code: 'ms', name: 'Mississippi' },
  { code: 'mo', name: 'Missouri' },       { code: 'mt', name: 'Montana' },
  { code: 'ne', name: 'Nebraska' },       { code: 'nv', name: 'Nevada' },
  { code: 'nh', name: 'New Hampshire' },  { code: 'nj', name: 'New Jersey' },
  { code: 'nm', name: 'New Mexico' },     { code: 'ny', name: 'New York' },
  { code: 'nc', name: 'North Carolina' }, { code: 'nd', name: 'North Dakota' },
  { code: 'oh', name: 'Ohio' },           { code: 'ok', name: 'Oklahoma' },
  { code: 'or', name: 'Oregon' },         { code: 'pa', name: 'Pennsylvania' },
  { code: 'ri', name: 'Rhode Island' },   { code: 'sc', name: 'South Carolina' },
  { code: 'sd', name: 'South Dakota' },   { code: 'tn', name: 'Tennessee' },
  { code: 'tx', name: 'Texas' },          { code: 'ut', name: 'Utah' },
  { code: 'vt', name: 'Vermont' },        { code: 'va', name: 'Virginia' },
  { code: 'wa', name: 'Washington' },     { code: 'wv', name: 'West Virginia' },
  { code: 'wi', name: 'Wisconsin' },      { code: 'wy', name: 'Wyoming' },
  { code: 'dc', name: 'Washington D.C.' },
]

// ── Confidence levels ─────────────────────────────────────────────────────────

const CONFIDENCE_LEVELS = [
  {
    id: 'beginner',
    label: 'Just starting',
    desc: "Haven't studied yet",
    Icon: MdSentimentVeryDissatisfied,
    color: 'text-red-400',
    activeClass: 'border-red-500 bg-red-500/10',
  },
  {
    id: 'learning',
    label: 'Getting there',
    desc: "Studied some material",
    Icon: MdSentimentNeutral,
    color: 'text-gold-500',
    activeClass: 'border-gold-600 bg-gold-500/10',
  },
  {
    id: 'ready',
    label: 'Almost ready',
    desc: 'Feeling confident',
    Icon: MdSentimentVerySatisfied,
    color: 'text-green-500',
    activeClass: 'border-green-500 bg-green-500/10',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface OnboardingPageProps {
  onDone: () => void
}

export function OnboardingPage({ onDone }: OnboardingPageProps) {
  const [step, setStep]               = useState(0)
  const [direction, setDirection]     = useState<1 | -1>(1)
  const [stateCode, setStateCode]     = useState('ok')
  const [testDate, setTestDate]       = useState('')
  const [confidence, setConfidence]   = useState<string | null>(null)
  const [animating, setAnimating]     = useState(false)

  const setUser             = useUserStore((s) => s.setUser)
  const setNeedsOnboarding  = useUserStore((s) => s.setNeedsOnboarding)
  const currentUser         = useUserStore((s) => s.user)

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE)

  const TOTAL_STEPS = 3

  function advance(dir: 1 | -1 = 1) {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setStep((s) => s + dir)
      setAnimating(false)
    }, 220)
  }

  async function handleFinish() {
    try {
      const { data } = await updateProfile({
        variables: {
          stateCode,
          testDate: testDate || undefined,
        },
      })
      if (data?.updateProfile && currentUser) {
        setUser({
          ...currentUser,
          stateCode: data.updateProfile.stateCode,
          testDate: data.updateProfile.testDate ?? undefined,
        })
      }
    } catch {
      // Non-blocking — proceed to home anyway
    }
    setNeedsOnboarding(false)
    onDone()
  }

  // ── Step content ─────────────────────────────────────────────────────────

  const slideClass = animating
    ? direction === 1 ? 'opacity-0 -translate-x-4' : 'opacity-0 translate-x-4'
    : 'opacity-100 translate-x-0'

  return (
    <div className="min-h-dvh bg-bg flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <AppLogo height={28} />
        <button
          onClick={() => { setNeedsOnboarding(false); onDone() }}
          className="text-xs text-text-secondary hover:text-text-primary underline"
        >
          Skip for now
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-4">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-green-500' : i < step ? 'w-3 bg-green-700' : 'w-3 bg-surface-3'
            }`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className={`flex-1 px-5 pt-2 transition-all duration-200 ease-out ${slideClass}`}>

        {/* ── Step 0: State ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-700/40 flex items-center justify-center flex-shrink-0">
                <GiSteeringWheel size={22} className="text-green-500" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-text-primary">Which state?</h2>
                <p className="text-sm text-text-secondary">Pick the state whose permit test you're studying for.</p>
              </div>
            </div>

            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="input text-base"
              size={1}
            >
              {US_STATES.map(({ code, name }) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>

            <div className="card bg-surface-2 border-border text-xs text-text-secondary">
              <p className="font-medium text-text-primary mb-1">
                {US_STATES.find((s) => s.code === stateCode)?.name} Permit Exam
              </p>
              <p>DriveReady tailors your questions, rules, and study plan to your state.</p>
            </div>
          </div>
        )}

        {/* ── Step 1: Test Date ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-600/40 flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-gold-500" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-text-primary">When's your test?</h2>
                <p className="text-sm text-text-secondary">We'll count down and prioritize your weak spots.</p>
              </div>
            </div>

            <div>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input text-base"
              />
              <p className="text-xs text-text-secondary mt-1.5">Optional — you can set this later in your profile.</p>
            </div>
          </div>
        )}

        {/* ── Step 2: Confidence ────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary mb-1">How prepared are you?</h2>
              <p className="text-sm text-text-secondary">This helps us set your starting difficulty.</p>
            </div>

            <div className="space-y-3">
              {CONFIDENCE_LEVELS.map(({ id, label, desc, Icon, color, activeClass }) => (
                <button
                  key={id}
                  onClick={() => setConfidence(id)}
                  className={`w-full text-left flex items-center gap-4 rounded-xl border-2 px-4 py-4 transition-all duration-150 ${
                    confidence === id ? activeClass : 'border-border bg-surface hover:border-green-700'
                  }`}
                >
                  <Icon size={32} className={confidence === id ? color : 'text-text-secondary'} />
                  <div>
                    <p className={`font-medium text-sm ${confidence === id ? 'text-text-primary' : 'text-text-primary'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-text-secondary">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Bottom actions */}
      <div className="px-5 pb-10 pt-4 flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={() => advance(-1)}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={18} />
            Back
          </button>
        )}

        <div className="flex-1" />

        {step < TOTAL_STEPS - 1 ? (
          <button
            onClick={() => advance(1)}
            className="btn-primary flex items-center gap-2 px-6"
          >
            Next
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={loading}
            className="btn-primary flex items-center gap-2 px-6 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Let's go!
          </button>
        )}
      </div>
    </div>
  )
}
