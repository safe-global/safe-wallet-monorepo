import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { cn } from '@safe-global/views/utils/cn'

const HEIGHT_TRANSITION = {
  expand: 'transition-[height] duration-[420ms] ease-soft',
  collapse: 'transition-[height] duration-[320ms] ease-in-out',
}

type Heights = { collapsed: number; full: number }

const useHeights = (contentRef: RefObject<HTMLElement | null>, peekUntil: RefObject<HTMLElement | null>) => {
  const [heights, setHeights] = useState<Heights>()

  useLayoutEffect(() => {
    const content = contentRef.current
    const peek = peekUntil.current
    if (!content || !peek) return
    const measure = () => {
      const full = content.offsetHeight
      const peekBottom = peek.getBoundingClientRect().bottom - content.getBoundingClientRect().top
      // 0 means not laid out yet (e.g. jsdom), so don't clip.
      setHeights(full > 0 ? { full, collapsed: Math.min(peekBottom, full) } : undefined)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    return () => observer.disconnect()
  }, [contentRef, peekUntil])

  return heights
}

export default function PeekCollapsible({
  id,
  open,
  onOpen,
  peekUntil,
  expandLabel,
  className,
  children,
}: {
  id?: string
  open: boolean
  onOpen: () => void
  /** The last element still visible while collapsed. */
  peekUntil: RefObject<HTMLElement | null>
  expandLabel: string
  className?: string
  children: ReactNode
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const heights = useHeights(contentRef, peekUntil)

  return (
    <div className="relative">
      <div
        id={id}
        style={heights && { height: open ? heights.full : heights.collapsed }}
        className={cn(
          // `clip`, not `hidden`, so sticky content inside still follows the page scroll.
          'overflow-clip motion-reduce:transition-none',
          open ? HEIGHT_TRANSITION.expand : HEIGHT_TRANSITION.collapse,
          className,
        )}
      >
        <div ref={contentRef}>{children}</div>
      </div>

      <div
        inert={open}
        aria-hidden={open || undefined}
        className={cn(
          'absolute inset-x-0 bottom-0 flex h-20 items-end justify-center rounded-b-xl pb-3 transition-opacity duration-300 ease-soft motion-reduce:transition-none',
          open ? 'pointer-events-none opacity-0' : 'opacity-100',
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-b-xl bg-linear-to-b from-card/0 to-card backdrop-blur-[3px] [mask-image:linear-gradient(to_bottom,transparent,black_45%)]"
        />
        <Button variant="outline" size="sm" weight="semibold" className="relative" onClick={onOpen}>
          {expandLabel}
        </Button>
      </div>
    </div>
  )
}
