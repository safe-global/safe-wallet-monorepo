import { Typography } from '@safe-global/views/components/ui/typography'
import { GROUP_OPTIONS, type GroupBy, type QueueDisplay } from '../../services/order'

// Option E: Group by as cards, each with its count. None is selected at first: the table is one flat list.
// A card groups the table. Pressing it again goes back to the flat list.
export function GroupByCards({
  display,
  counts,
  onChange,
  compact = false,
}: {
  display: QueueDisplay
  counts: Record<Exclude<GroupBy, 'none'>, number>
  onChange: (display: QueueDisplay) => void
  // On a phone: one row of pills, count and title only, that scrolls sideways if it has to.
  compact?: boolean
}) {
  return (
    <div
      role="group"
      aria-label="Group by"
      className={
        compact ? '-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1' : 'mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4'
      }
    >
      {GROUP_OPTIONS.map(({ value, card, short }) => {
        const count = counts[value]
        const selected = display.groupBy === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            aria-label={`${card} (${count}). ${short}`}
            onClick={() => onChange({ groupBy: selected ? 'none' : value })}
            className={`group/card flex rounded-xl border bg-card text-left ${compact ? 'shrink-0 items-center gap-2 py-1.5 pr-3 pl-1.5' : 'flex-col items-start gap-2 p-3'} transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${selected ? 'border-foreground/25' : 'border-transparent hover:border-border'}`}
          >
            <span
              className={`flex items-center justify-center rounded-lg px-2 font-semibold ${compact ? 'h-7 min-w-7 text-sm' : 'h-10 min-w-10 text-base'} tabular-nums transition-colors ${selected ? 'bg-success-subtle text-success-strong' : `bg-muted ${count ? 'text-foreground' : 'text-muted-foreground'} group-hover/card:bg-success-subtle group-hover/card:text-success-strong`}`}
            >
              {count}
            </span>
            {compact ? (
              <Typography variant="paragraph-small-bold" className="whitespace-nowrap">
                {card}
              </Typography>
            ) : (
              <span className="flex flex-col">
                <Typography variant="paragraph-bold">{card}</Typography>
                <Typography variant="paragraph-small" className="text-muted-foreground">
                  {short}
                </Typography>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
