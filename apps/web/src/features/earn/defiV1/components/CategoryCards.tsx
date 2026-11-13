import { ArrowRight, Clock } from 'lucide-react'
import { DEFI_V1_COPY, formatApy } from '../copy'
import type { CategoryHighlight } from '../shelf'

export const CategoryCards = ({
  highlights,
  onSelect,
}: {
  highlights: CategoryHighlight[]
  onSelect: (highlight: CategoryHighlight) => void
}) => (
  <div className="grid gap-3 sm:grid-cols-3" data-testid="category-cards">
    {highlights.map((highlight) => (
      <button
        key={highlight.category}
        type="button"
        onClick={() => onSelect(highlight)}
        data-testid={`category-card-${highlight.category}`}
        className="group/card flex flex-col gap-2 rounded-xl border border-transparent bg-card p-4 text-left transition-colors hover:border-border"
      >
        <span className="flex items-center justify-between gap-2 text-sm font-medium">
          {DEFI_V1_COPY.category[highlight.category].title}
          <ArrowRight
            className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100"
            aria-hidden
          />
        </span>
        <span className="text-xl font-semibold tabular-nums">
          {DEFI_V1_COPY.bestRate(formatApy(highlight.bestApy))}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          {highlight.exitLabel} · {highlight.count} options
        </span>
      </button>
    ))}
  </div>
)
