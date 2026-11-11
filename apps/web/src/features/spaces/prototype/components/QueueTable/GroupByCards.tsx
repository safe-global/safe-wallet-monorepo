import { Typography } from '@safe-global/views/components/ui/typography'
import { GROUP_OPTIONS, type GroupBy, type QueueDisplay } from '../../services/order'

// Option E: Group by as option B's stat cards, each with its count. One card is always selected.
export function GroupByCards({
  display,
  counts,
  onChange,
}: {
  display: QueueDisplay
  counts: Record<GroupBy, number>
  onChange: (display: QueueDisplay) => void
}) {
  return (
    <div role="radiogroup" aria-label="Group by" className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
      {GROUP_OPTIONS.map(({ value, card, short }) => {
        const count = counts[value]
        const selected = display.groupBy === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${card} (${count}). ${short}`}
            onClick={() => onChange({ groupBy: value })}
            className={`group/card flex flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${selected ? 'border-foreground/25' : 'border-transparent hover:border-border'}`}
          >
            <span
              className={`flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-base font-semibold tabular-nums transition-colors ${selected ? 'bg-success-subtle text-success-strong' : `bg-muted ${count ? 'text-foreground' : 'text-muted-foreground'} group-hover/card:bg-success-subtle group-hover/card:text-success-strong`}`}
            >
              {count}
            </span>
            <span className="flex flex-col">
              <Typography variant="paragraph-bold">{card}</Typography>
              <Typography variant="paragraph-small" className="text-muted-foreground">
                {short}
              </Typography>
            </span>
          </button>
        )
      })}
    </div>
  )
}
