import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface ChooserRowProps {
  icon: ReactNode
  title: string
  subtitle?: string
  onClick: () => void
  disabled?: boolean
  disabledTooltip?: string
  warning?: string
  testId?: string
}

/**
 * A single selectable option inside an "Add Safe accounts" chooser dialog:
 * icon + title (+ optional subtitle/warning) and a trailing chevron. Shared by
 * the Space and personal My accounts choosers so both stay visually consistent.
 */
export const ChooserRow = ({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
  disabledTooltip,
  warning,
  testId,
}: ChooserRowProps) => {
  const row = (
    <button
      type="button"
      data-testid={testId}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      className={cn(
        'group flex w-full items-center gap-3 rounded-md p-3 text-left text-sm text-sidebar-foreground transition-colors',
        '[&_svg]:[stroke-width:2] [&_svg]:transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:[&_svg]:text-green-500',
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold">{title}</span>
        {subtitle && (
          <span className="block text-xs text-muted-foreground mt-1 group-hover:text-sidebar-accent-foreground/70">
            {subtitle}
          </span>
        )}
        {warning && <span className="block text-xs text-destructive mt-1">{warning}</span>}
      </span>
      <ChevronRight className="size-3.5 shrink-0" />
    </button>
  )

  if (disabled && disabledTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger render={row} />
        <TooltipContent>{disabledTooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return row
}

export default ChooserRow
