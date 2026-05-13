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

import { useEffect, useRef } from 'react'

interface DiamondLogoProps {
  size?: number
  animated?: boolean
  className?: string
}

const TOTAL = 120
const colBits = Array.from({ length: TOTAL }, (_, i) =>
  Math.sin(i * 7.3 + 2.1) > 0 ? '1' : '0'
)

interface DrawOpts {
  mouseX?: number
  mouseY?: number
  scroll?: number
  animated?: boolean
}

function drawDiamond(ctx: CanvasRenderingContext2D, W: number, H: number, opts: DrawOpts = {}) {
  const { mouseX = -999, mouseY = -999, scroll = 42, animated = false } = opts
  const CX = W / 2
  const CY = H / 2
  const R = W * 0.46
  ctx.clearRect(0, 0, W, H)
  const fontSize = Math.max(6, W * 0.082)
  const cellW = fontSize * 1.08
  const cellH = fontSize * 1.28
  const COLS = Math.ceil(W / cellW) + 2
  const ROWS = Math.ceil(H / cellH) + 4
  const NUM_COLS = 18

  function inDiamond(px: number, py: number) {
    return Math.abs(px - CX) / R + Math.abs(py - CY) / R <= 1
  }
  function radialAlpha(px: number, py: number) {
    const d = Math.abs(px - CX) / R + Math.abs(py - CY) / R
    if (d >= 1) return 0
    if (d < 0.22) return 1
    if (d < 0.58) return 1 - ((d - 0.22) / 0.36) * 0.42
    return 0.58 - ((d - 0.58) / 0.42) * 0.58
  }
  function teleScale(px: number, py: number) {
    if (!animated) return 1
    const dx = px - mouseX
    const dy = py - mouseY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const radius = W * 0.28
    if (dist > radius) return 1
    return 1 + (1 - dist / radius) * 0.9
  }

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(CX, CY - (R - 13))
  ctx.lineTo(CX + (R - 13), CY)
  ctx.lineTo(CX, CY + (R - 13))
  ctx.lineTo(CX - (R - 13), CY)
  ctx.closePath()
  ctx.clip()

  for (let c = 0; c < COLS; c++) {
    const colScroll = animated
      ? (scroll * (0.18 + (c % NUM_COLS) * 0.007)) % TOTAL
      : (c * 3.7) % TOTAL
    for (let r = -1; r < ROWS + 3; r++) {
      const srcIdx = ((Math.floor(r + colScroll)) % TOTAL + TOTAL) % TOTAL
      const bit = colBits[(c * 13 + srcIdx) % TOTAL]
      const px = c * cellW + cellW * 0.35
      const py = r * cellH + cellH * 0.5 - (colScroll % 1) * cellH
      if (!inDiamond(px, py)) continue
      const alpha = radialAlpha(px, py)
      if (alpha < 0.04) continue
      const scale = teleScale(px, py)
      const fs = fontSize * scale
      ctx.globalAlpha = Math.min(1, alpha * scale)
      ctx.fillStyle = bit === '1' ? '#00ee55' : '#00ddff'
      ctx.font = `900 ${fs.toFixed(1)}px monospace`
      ctx.fillText(bit, px - fs * 0.28, py + fs * 0.36)
    }
  }
  ctx.restore()
  ctx.globalAlpha = 1

  // Outer diamond border
  ctx.beginPath()
  ctx.moveTo(CX, CY - (R - 1))
  ctx.lineTo(CX + (R - 1), CY)
  ctx.lineTo(CX, CY + (R - 1))
  ctx.lineTo(CX - (R - 1), CY)
  ctx.closePath()
  ctx.strokeStyle = 'rgba(220,220,220,0.85)'
  ctx.lineWidth = Math.max(1, W * 0.017)
  ctx.stroke()

  // Inner diamond border
  ctx.beginPath()
  ctx.moveTo(CX, CY - (R - 13))
  ctx.lineTo(CX + (R - 13), CY)
  ctx.lineTo(CX, CY + (R - 13))
  ctx.lineTo(CX - (R - 13), CY)
  ctx.closePath()
  ctx.strokeStyle = 'rgba(200,200,200,0.55)'
  ctx.lineWidth = Math.max(0.8, W * 0.011)
  ctx.stroke()
}

export function DiamondLogo({ size = 32, animated = false, className }: DiamondLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ scroll: 0, mouseX: -999, mouseY: -999, raf: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!animated) {
      drawDiamond(ctx, size, size, { scroll: 42 })
      return
    }

    function loop() {
      stateRef.current.scroll += 0.06
      drawDiamond(ctx!, size, size, {
        mouseX: stateRef.current.mouseX,
        mouseY: stateRef.current.mouseY,
        scroll: stateRef.current.scroll,
        animated: true,
      })
      stateRef.current.raf = requestAnimationFrame(loop)
    }

    function handleMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      stateRef.current.mouseX = (e.clientX - rect.left) * (canvas!.width / rect.width)
      stateRef.current.mouseY = (e.clientY - rect.top) * (canvas!.height / rect.height)
    }
    function handleLeave() {
      stateRef.current.mouseX = -999
      stateRef.current.mouseY = -999
    }

    canvas.addEventListener('mousemove', handleMove)
    canvas.addEventListener('mouseleave', handleLeave)
    loop()

    return () => {
      cancelAnimationFrame(stateRef.current.raf)
      canvas.removeEventListener('mousemove', handleMove)
      canvas.removeEventListener('mouseleave', handleLeave)
    }
  }, [size, animated])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      aria-label="CodeBreeder diamond logo"
    />
  )
}
