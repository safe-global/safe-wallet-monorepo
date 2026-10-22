import { Typography } from '@safe-global/views/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { FLAG_META } from '../shared'

type Tone = 'warning' | 'success'
// Hover and selected tint the count by what the card is about.
const TONES: Record<Tone, { hover: string; active: string }> = {
  warning: {
    hover:
      'group-enabled/pulse:group-hover/pulse:bg-warning-subtle group-enabled/pulse:group-hover/pulse:text-warning-strong',
    active: 'bg-warning-subtle text-warning-strong',
  },
  success: {
    hover:
      'group-enabled/pulse:group-hover/pulse:bg-success-subtle group-enabled/pulse:group-hover/pulse:text-success-strong',
    active: 'bg-success-subtle text-success-strong',
  },
}
export type FleetCardKey = 'safes' | 'signers' | 'conflicting' | 'blocked' | 'untrusted' | 'stale'
// Safes and Signers swap the queue for a list. The rest are shortcuts to Status filters.
const CARDS: { key: FleetCardKey; label: (count: number) => string; hint: string; tone: Tone }[] = [
  {
    key: 'safes',
    label: (count) => (count === 1 ? 'Safe' : 'Safes'),
    hint: 'Every Safe in the workspace, with what is pending on each.',
    tone: 'success',
  },
  {
    key: 'signers',
    label: (count) => (count === 1 ? 'Signer' : 'Signers'),
    hint: 'Every signer across your Safes, most transactions waiting first.',
    tone: 'success',
  },
  { key: 'conflicting', label: () => FLAG_META.conflicting.short, hint: FLAG_META.conflicting.hint, tone: 'warning' },
  {
    key: 'blocked',
    label: () => 'Blocked',
    hint: 'Waiting on an earlier transaction in the same Safe to execute first.',
    tone: 'warning',
  },
  { key: 'untrusted', label: () => FLAG_META.untrusted.short, hint: FLAG_META.untrusted.hint, tone: 'warning' },
  { key: 'stale', label: () => FLAG_META.stale.short, hint: FLAG_META.stale.hint, tone: 'warning' },
]

// The Policies catalogue tile (Figma Policies 5167:466), with the count where the icon sits.
function PulseCard({
  count,
  label,
  hint,
  tone,
  selected,
  disabled,
  onClick,
}: {
  count: number
  label: string
  hint: string
  tone: Tone
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Tooltip delay={300}>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={onClick}
            className={`group/pulse flex flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default ${selected ? 'border-foreground/25' : 'border-transparent enabled:hover:border-border'}`}
          />
        }
      >
        <span
          className={`flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-base font-semibold tabular-nums transition-colors ${selected ? TONES[tone].active : `bg-muted ${count ? 'text-foreground' : 'text-muted-foreground'} ${TONES[tone].hover}`}`}
        >
          {count}
        </span>
        <Typography variant="paragraph-bold" className={count ? undefined : 'text-muted-foreground'}>
          {label}
        </Typography>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-normal">{hint}</TooltipContent>
    </Tooltip>
  )
}

// Fleet admin: one card per signal across every Safe.
export function FleetPulse({
  counts,
  isActive,
  onSelect,
}: {
  counts: Record<FleetCardKey, number>
  isActive: (key: FleetCardKey) => boolean
  onSelect: (key: FleetCardKey) => void
}) {
  return (
    <div role="group" aria-label="Fleet overview" className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {CARDS.map(({ key, label, hint, tone }) => (
        <PulseCard
          key={key}
          count={counts[key]}
          label={label(counts[key])}
          hint={hint}
          tone={tone}
          selected={isActive(key)}
          disabled={!counts[key] && !isActive(key)}
          onClick={() => onSelect(key)}
        />
      ))}
    </div>
  )
}
