import { ArrowRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { type AddPolicyOption } from './options'

export interface AddPolicyOptionButtonProps extends AddPolicyOption {
  onClick?: () => void
  className?: string
}

const AddPolicyOptionButton = ({
  id,
  title,
  description,
  Icon,
  disabled,
  disabledTooltip,
  onClick,
  className,
}: AddPolicyOptionButtonProps) => {
  const row = (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      data-testid={`add-policy-option-${id}`}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl bg-muted p-4 text-left transition-colors',
        '[&_svg]:[stroke-width:2] [&_svg]:transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-secondary-hover hover:[&_svg]:text-green-500',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card">
        <Icon className="size-4" aria-hidden />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-1">
          <Typography variant="paragraph-bold" as="span">
            {title}
          </Typography>
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>

        <Typography variant="paragraph-small" color="muted" as="span">
          {description}
        </Typography>
      </span>
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

export default AddPolicyOptionButton
