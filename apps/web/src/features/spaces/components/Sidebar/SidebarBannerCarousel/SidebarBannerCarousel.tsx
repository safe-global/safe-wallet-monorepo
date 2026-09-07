import { Children, useState, type ReactElement, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

/**
 * Shows one sidebar banner at a time. With a single banner it renders just that banner; with more,
 * it adds previous/next controls that wrap around. Falsy children are skipped, so callers can pass
 * `{condition && <Banner />}` for each banner.
 */
export const SidebarBannerCarousel = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}): ReactElement | null => {
  const slides = Children.toArray(children)
  const [activeIndex, setActiveIndex] = useState(0)

  if (slides.length === 0) return null

  // A slide can disappear while it is active (dismissed, or hidden on some route), so the stored
  // index is clamped instead of trusted.
  const index = Math.min(activeIndex, slides.length - 1)
  const goTo = (next: number) => setActiveIndex((next + slides.length) % slides.length)

  return (
    <div className={cn('flex w-full flex-col gap-2', className)} data-testid="sidebar-banner-carousel">
      {slides[index]}

      {slides.length > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon-xs" onClick={() => goTo(index - 1)} aria-label="Previous banner">
            <ChevronLeft />
          </Button>

          <div className="flex items-center gap-1.5" aria-hidden>
            {slides.map((_, dotIndex) => (
              <span
                key={dotIndex}
                data-testid="sidebar-banner-carousel-dot"
                data-active={dotIndex === index}
                className={cn(
                  'size-1.5 rounded-full transition-colors',
                  dotIndex === index ? 'bg-foreground' : 'bg-foreground/20',
                )}
              />
            ))}
          </div>

          <Button variant="ghost" size="icon-xs" onClick={() => goTo(index + 1)} aria-label="Next banner">
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  )
}
