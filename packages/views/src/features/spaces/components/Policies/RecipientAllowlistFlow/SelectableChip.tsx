import type { ReactElement, ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { Toggle } from '@safe-global/views/components/ui/toggle'
import { cn } from '@safe-global/views/utils/cn'

type SelectableChipProps = {
  selected: boolean
  onToggle: (selected: boolean) => void
  'aria-label': string
  children: ReactNode
  className?: string
}

const SelectableChip = ({
  selected,
  onToggle,
  'aria-label': ariaLabel,
  children,
  className,
}: SelectableChipProps): ReactElement => (
  <Toggle
    variant="chip"
    size="lg"
    pressed={selected}
    onPressedChange={(next) => onToggle(next)}
    aria-label={ariaLabel}
    className={cn('pr-3.5 pl-1.75', className)}
  >
    {children}
    {selected && (
      <span className="ml-2 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
        <Check className="size-3 group-hover/toggle:hidden group-focus-visible/toggle:hidden" aria-hidden />
        <X className="hidden size-3 group-hover/toggle:block group-focus-visible/toggle:block" aria-hidden />
      </span>
    )}
  </Toggle>
)

export default SelectableChip
