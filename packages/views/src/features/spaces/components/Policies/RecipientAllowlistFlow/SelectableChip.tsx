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
    variant="outline"
    size="lg"
    pressed={selected}
    onPressedChange={(next) => onToggle(next)}
    aria-label={ariaLabel}
    className={cn(
      'gap-2 rounded-full border-border bg-transparent pr-3.5 pl-[7px] leading-none shadow-xs hover:bg-[var(--color-background-secondary)] hover:text-foreground aria-pressed:bg-card aria-pressed:hover:bg-[var(--color-background-secondary)]',
      !selected && 'opacity-50 hover:bg-card hover:opacity-100',
      className,
    )}
  >
    {children}
    {selected && (
      <span className="ml-2 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
        <Check className="size-3 group-hover/toggle:hidden" aria-hidden />
        <X className="hidden size-3 group-hover/toggle:block" aria-hidden />
      </span>
    )}
  </Toggle>
)

export default SelectableChip
