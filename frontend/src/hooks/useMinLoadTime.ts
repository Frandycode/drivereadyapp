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

import { useState, useEffect } from 'react'

/**
 * Enforces a minimum skeleton display time so fast network responses
 * don't cause a jarring flash. Returns true while the skeleton should show.
 */
export function useMinLoadTime(loading: boolean, minMs = 800): boolean {
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), minMs)
    return () => clearTimeout(t)
  }, [])

  return loading || !minElapsed
}
