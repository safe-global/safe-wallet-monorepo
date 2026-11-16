import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@safe-global/views/utils/cn'

interface FitTextProps {
  children: ReactNode
  maxFontSize: number
  minFontSize: number
  className?: string
}

// Absorbs floating-point error so text that exactly fills its box is not stepped down
const EPSILON = 1e-6

/** Single-line text that shrinks to fit a parent of definite width (never grows inside a content-sized one); below `minFontSize` it ellipsizes with a hover title. */
const FitText = ({ children, maxFontSize, minFontSize, className }: FitTextProps) => {
  const containerRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const fontSizeRef = useRef(maxFontSize)
  const [fontSize, setFontSize] = useState(maxFontSize)
  const [truncatedTitle, setTruncatedTitle] = useState<string>()

  const fit = useCallback(() => {
    const available = containerRef.current?.getBoundingClientRect().width ?? 0
    const textWidth = textRef.current?.getBoundingClientRect().width ?? 0
    if (!available || !textWidth) return

    // Text width scales linearly with font size, so one measurement gives the fitting size
    const widthPerPx = textWidth / fontSizeRef.current
    const fitting = Math.floor(available / widthPerPx + EPSILON)
    const next = Math.min(maxFontSize, Math.max(minFontSize, fitting))

    fontSizeRef.current = next
    setFontSize(next)
    setTruncatedTitle(widthPerPx * next > available + EPSILON ? (textRef.current?.textContent ?? '') : undefined)
  }, [maxFontSize, minFontSize])

  useLayoutEffect(() => fit(), [fit, children])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(fit)
    observer.observe(container)
    document.fonts?.addEventListener('loadingdone', fit)

    return () => {
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', fit)
    }
  }, [fit])

  return (
    <span
      ref={containerRef}
      className={cn('block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap', className)}
      style={{ fontSize }}
      title={truncatedTitle}
    >
      <span ref={textRef}>{children}</span>
    </span>
  )
}

export { FitText }
export type { FitTextProps }
