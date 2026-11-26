import type { ReactElement, ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { Toggle } from '@safe-global/views/components/ui/toggle'
import { cn } from '@safe-global/views/utils/cn'

type SelectableChipProps = {
  selected: boolean
  onToggle: (selected: boolean) => void
  'aria-label': string
  icon: ReactNode
  label: ReactNode
  /** Right after the label, e.g. the address book icon. */
  labelSuffix?: ReactNode
  /** A second line under the label, e.g. a recipient's short address: the chip grows to two lines. */
  subline?: ReactNode
  className?: string
}

const SelectableChip = ({
  selected,
  onToggle,
  'aria-label': ariaLabel,
  icon,
  label,
  labelSuffix,
  subline,
  className,
}: SelectableChipProps): ReactElement => (
  <Toggle
    variant="chip"
    size="lg"
    pressed={selected}
    onPressedChange={(next) => onToggle(next)}
    aria-label={ariaLabel}
    // Two lines with a 24px icon: 10px around it, so the inset matches top, bottom and left
    className={cn('min-w-0 pr-3.5 pl-1.75', subline && 'h-auto py-[7px] pl-2.5', className)}
  >
    <span className="flex shrink-0">{icon}</span>
    {subline ? (
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
        <span className="flex w-full min-w-0 items-center gap-1">
          <span className="truncate">{label}</span>
          {labelSuffix}
        </span>
        {subline}
      </span>
    ) : (
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate">{label}</span>
        {labelSuffix}
      </span>
    )}
    {selected && (
      <span className="ml-2 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
        <Check className="size-3 group-hover/toggle:hidden group-focus-visible/toggle:hidden" aria-hidden />
        <X className="hidden size-3 group-hover/toggle:block group-focus-visible/toggle:block" aria-hidden />
      </span>
    )}
  </Toggle>
)

export default SelectableChip
