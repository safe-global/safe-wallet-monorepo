import { RefreshCwIcon, type LucideProps } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

const RefreshIcon = (props: LucideProps & { isLoading?: boolean }) => {
  const { isLoading, className, ...iconProps } = props

  return <RefreshCwIcon {...iconProps} className={cn('size-4', isLoading && css.spinning, className)} />
}

export type RefreshPositionsButtonViewProps = {
  tooltip?: string
  label: string
  size: 'small' | 'medium' | 'large'
  buttonClassName?: string
  isLoading: boolean
  isOnCooldown: boolean
  isDisabled: boolean
  shouldUsePortfolioEndpoint: boolean
  onRefresh: () => void
}

export const RefreshPositionsButtonView = ({
  tooltip,
  label,
  size,
  buttonClassName,
  isLoading,
  isOnCooldown,
  isDisabled,
  shouldUsePortfolioEndpoint,
  onRefresh,
}: RefreshPositionsButtonViewProps) => {
  const defaultTooltip = isOnCooldown
    ? 'Refreshed. Please wait 30 seconds'
    : shouldUsePortfolioEndpoint
      ? 'Refresh portfolio data'
      : 'Refresh positions data'

  const displayTooltip = isOnCooldown ? defaultTooltip : (tooltip ?? defaultTooltip)

  if (!label) {
    const iconButtonSize = size === 'large' ? 'icon' : size === 'medium' ? 'icon-sm' : 'icon-xs'
    const iconButton = (
      <Button
        variant="ghost"
        size={iconButtonSize}
        onClick={onRefresh}
        disabled={isDisabled}
        className={buttonClassName}
      >
        <RefreshIcon isLoading={isLoading} />
      </Button>
    )

    if (!displayTooltip) {
      return iconButton
    }

    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>{iconButton}</TooltipTrigger>
        <TooltipContent>{displayTooltip}</TooltipContent>
      </Tooltip>
    )
  }

  const buttonSize = size === 'large' ? 'lg' : size === 'medium' ? 'default' : 'sm'
  const button = (
    <Button variant="ghost" size={buttonSize} onClick={onRefresh} disabled={isDisabled} className={buttonClassName}>
      <RefreshIcon isLoading={isLoading} />
      {label}
    </Button>
  )

  if (!displayTooltip) {
    return button
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{button}</TooltipTrigger>
      <TooltipContent>{displayTooltip}</TooltipContent>
    </Tooltip>
  )
}
