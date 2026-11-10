import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@safe-global/views/utils/cn'

interface FitTextProps {
  children: string
  maxFontSize: number
  minFontSize: number
  className?: string
}

/** Single-line text that shrinks to fit its parent's width; below `minFontSize` it ellipsizes and shows the full text on hover. */
const FitText = ({ children, maxFontSize, minFontSize, className }: FitTextProps) => {
  const containerRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const fontSizeRef = useRef(maxFontSize)
  const [fontSize, setFontSize] = useState(maxFontSize)
  const [isTruncated, setIsTruncated] = useState(false)

  const fit = useCallback(() => {
    const available = containerRef.current?.clientWidth ?? 0
    const textWidth = textRef.current?.getBoundingClientRect().width ?? 0
    if (!available || !textWidth) return

    // Text width scales linearly with font size, so one measurement gives the fitting size
    const widthPerPx = textWidth / fontSizeRef.current
    const next = Math.min(maxFontSize, Math.max(minFontSize, Math.floor(available / widthPerPx)))

    fontSizeRef.current = next
    setFontSize(next)
    setIsTruncated(widthPerPx * next > available)
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
      title={isTruncated ? children : undefined}
    >
      <span ref={textRef}>{children}</span>
    </span>
  )
}

export { FitText }
export type { FitTextProps }
