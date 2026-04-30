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

import logoNoBg from '@/assets/logo-no-bg.png'

interface AppLogoProps {
  height?: number
  className?: string
}

export function AppLogo({ height = 32, className = '' }: AppLogoProps) {
  return (
    <img
      src={logoNoBg}
      alt="DriveReady"
      style={{ height, width: 'auto' }}
      className={className}
      draggable={false}
    />
  )
}
