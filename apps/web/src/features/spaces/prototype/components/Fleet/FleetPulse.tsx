import { Typography } from '@safe-global/views/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { PULSE, type PulseKey } from '../../services/fleet'

type Tone = 'destructive' | 'warning' | 'success'
// Hover and selected tint the count by what the card is about.
const TONES: Record<Tone, { hover: string; active: string }> = {
  destructive: {
    hover:
      'group-enabled/pulse:group-hover/pulse:bg-destructive/10 group-enabled/pulse:group-hover/pulse:text-destructive',
    active: 'bg-destructive/10 text-destructive',
  },
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
const PULSE_TONES: Record<PulseKey, Tone> = {
  emergency: 'destructive',
  conflicting: 'warning',
  untrusted: 'warning',
  stale: 'warning',
}

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

// Fleet admin: one card per signal across every Safe. Each card is a shortcut to a filter.
export function FleetPulse({
  pulse,
  isActive,
  onSelect,
  signers,
}: {
  pulse: { key: PulseKey; count: number }[]
  isActive: (key: PulseKey) => boolean
  // Toggles the filter for that card.
  onSelect: (key: PulseKey) => void
  // The last card opens the signer view instead of filtering.
  signers: { count: number; open: boolean; onToggle: () => void }
}) {
  return (
    <div role="group" aria-label="Fleet overview" className="mb-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
      {pulse.map(({ key, count }) => (
        <PulseCard
          key={key}
          count={count}
          label={PULSE[key].label}
          hint={PULSE[key].hint}
          tone={PULSE_TONES[key]}
          selected={isActive(key)}
          disabled={!count && !isActive(key)}
          onClick={() => onSelect(key)}
        />
      ))}
      <PulseCard
        count={signers.count}
        label={signers.count === 1 ? 'Signer' : 'Signers'}
        hint="Every signer across your Safes, most transactions waiting first."
        tone="success"
        selected={signers.open}
        onClick={signers.onToggle}
      />
    </div>
  )
}
