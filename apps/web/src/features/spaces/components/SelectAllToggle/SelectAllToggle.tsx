import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export type SelectAllState = 'none' | 'some' | 'all'

interface SelectAllToggleProps {
  state: SelectAllState
  count: number
  total: number
  onToggle: (check: boolean) => void
  label?: string
  showCount?: boolean
  countTooltip?: string
  className?: string
  disabled?: boolean
  testId?: string
}

const SelectAllToggle = ({
  state,
  count,
  total,
  onToggle,
  label = 'Select all',
  showCount = false,
  countTooltip,
  className,
  disabled,
  testId,
}: SelectAllToggleProps) => {
  const checked = state === 'all'
  const indeterminate = state === 'some'

  const handleChange = () => {
    onToggle(state !== 'all')
  }

  const showCountText = showCount && total > 0

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-label={showCountText ? `${label} (${count}/${total})` : label}
        onClick={handleChange}
        disabled={disabled || total === 0}
        data-testid={testId}
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Checkbox checked={checked} indeterminate={indeterminate} tabIndex={-1} aria-hidden />
        <span className="text-muted-foreground">{label}</span>
      </button>
      {showCountText &&
        (countTooltip ? (
          <Tooltip>
            <TooltipTrigger
              render={<span />}
              className="cursor-help text-sm text-muted-foreground underline decoration-dotted underline-offset-2"
            >
              ({count}/{total})
            </TooltipTrigger>
            <TooltipContent>{countTooltip}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-sm text-muted-foreground">
            ({count}/{total})
          </span>
        ))}
    </div>
  )
}

export default SelectAllToggle
