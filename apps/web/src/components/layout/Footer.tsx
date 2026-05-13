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

import { DiamondLogo } from '@/components/codebreeder/DiamondLogo'

interface FooterProps {
  onNavigate?: (path: string) => void
}

const YEAR = new Date().getFullYear()

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="relative bg-navy-deep border-t border-border overflow-hidden">
      {/* Blueprint grid behind the footer content */}
      <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-60" />

      <div className="relative max-w-dashboard mx-auto px-4 sm:px-8 py-8 sm:py-10">
        {/* Top row: brand + copyright + links */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="26" viewBox="0 0 60 68" fill="none" aria-hidden="true">
              <path d="M30 2 L56 14 L56 38 Q56 58 30 66 Q4 58 4 38 L4 14 Z" fill="#F45B26" />
              <path d="M30 8 L50 18 L50 38 Q50 55 30 62 Q10 55 10 38 L10 18 Z" fill="#021A54" />
              <polyline
                points="18,36 27,46 44,28"
                stroke="#F45B26"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span className="font-display font-bold text-[15px] text-white tracking-tight">
              Drive<em className="not-italic text-orange">Ready</em>
            </span>
          </div>

          <div className="text-text-muted text-xs mono tracking-wider">
            © {YEAR} DriveReady. All rights reserved.
          </div>

          <nav className="flex items-center gap-5 text-xs">
            <button
              onClick={() => onNavigate?.('/status')}
              className="text-text-secondary hover:text-white transition-colors"
            >
              Status
            </button>
            <a href="/privacy" className="text-text-secondary hover:text-white transition-colors">
              Privacy
            </a>
            <a href="/terms" className="text-text-secondary hover:text-white transition-colors">
              Terms
            </a>
            <a
              href="mailto:support@drivereadyapp.com"
              className="text-text-secondary hover:text-white transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Bottom row: Code Breeder credits, right-aligned */}
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-3 bg-navy-card/70 border border-border rounded-md px-3 py-1.5">
            <span className="mono text-[10px] tracking-[0.22em] text-text-muted uppercase">
              Crafted by
            </span>
            <DiamondLogo size={28} animated={false} />
            <div className="leading-tight">
              <div className="font-display font-extrabold text-[11px] tracking-[0.18em] text-white uppercase">
                Code
              </div>
              <div className="font-display font-extrabold text-[11px] tracking-[0.18em] text-white uppercase">
                Breeder
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
