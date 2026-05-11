import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/utils/cn'

export type SelectAllState = 'none' | 'some' | 'all'

interface SelectAllToggleProps {
  state: SelectAllState
  count: number
  total: number
  onToggle: (check: boolean) => void
  label?: string
  showCount?: boolean
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
  className,
  disabled,
  testId,
}: SelectAllToggleProps) => {
  const checked = state === 'all'
  const indeterminate = state === 'some'

  const handleChange = () => {
    onToggle(state !== 'all')
  }

  return (
    <button
      type="button"
      onClick={handleChange}
      disabled={disabled || total === 0}
      data-testid={testId}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <Checkbox checked={checked} indeterminate={indeterminate} tabIndex={-1} aria-hidden />
      <span className="text-muted-foreground">
        {label}
        {showCount && total > 0 && ` (${count}/${total})`}
      </span>
    </button>
  )
}

export default SelectAllToggle
