import { Layers, ListChecks, ListOrdered, Network, type LucideIcon } from 'lucide-react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { GROUP_OPTIONS, type GroupBy, type QueueDisplay } from '../../services/order'

const ICONS: Record<GroupBy, LucideIcon> = { status: ListChecks, safe: Layers, network: Network, next: ListOrdered }

// Option E: Group by as option B's stat cards, with an icon where the count sits. One card is always selected.
export function GroupByCards({
  display,
  onChange,
}: {
  display: QueueDisplay
  onChange: (display: QueueDisplay) => void
}) {
  return (
    <div role="radiogroup" aria-label="Group by" className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
      {GROUP_OPTIONS.map(({ value, label, short }) => {
        const Icon = ICONS[value]
        const selected = display.groupBy === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange({ groupBy: value })}
            className={`group/card flex flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${selected ? 'border-foreground/25' : 'border-transparent hover:border-border'}`}
          >
            <span
              className={`flex size-10 items-center justify-center rounded-lg transition-colors ${selected ? 'bg-success-subtle text-success-strong' : 'bg-muted text-foreground group-hover/card:bg-success-subtle group-hover/card:text-success-strong'}`}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="flex flex-col">
              <Typography variant="paragraph-bold">{label}</Typography>
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
