import type { ReactNode, Ref } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@safe-global/views/utils/cn'

export const TreasurySection = ({
  id,
  title,
  count,
  badge,
  summary,
  open,
  onOpenChange,
  ref,
  children,
}: {
  id: string
  title: string
  count: number
  badge?: ReactNode
  summary?: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  ref?: Ref<HTMLElement>
  children: ReactNode
}) => (
  <section
    ref={ref}
    aria-labelledby={`${id}-title`}
    className="flex scroll-mt-6 flex-col gap-3"
    data-testid={`section-${id}`}
  >
    <button
      type="button"
      aria-expanded={open}
      aria-controls={`${id}-content`}
      onClick={() => onOpenChange(!open)}
      className="flex min-h-11 w-full items-center gap-3 rounded-lg bg-foreground/[0.03] px-3 text-left transition-colors outline-none hover:bg-foreground/[0.06] focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronDown
        aria-hidden
        className={cn('size-4 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')}
      />
      <h2 id={`${id}-title`} className="flex items-center gap-3 text-sm font-medium">
        <span>{title}</span>
        <span className="font-normal tabular-nums text-muted-foreground">{count}</span>
      </h2>
      {badge}
      {summary && <span className="ml-auto truncate text-xs text-muted-foreground">{summary}</span>}
    </button>
    <div id={`${id}-content`} hidden={!open}>
      {children}
    </div>
  </section>
)
