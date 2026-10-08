import { RefreshCwIcon, type LucideProps } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

const RefreshIcon = (props: LucideProps & { isLoading?: boolean }) => {
  const { isLoading, className, ...iconProps } = props
  return (
    <RefreshCwIcon
      {...iconProps}
      className={cn('size-3.5 text-muted-foreground', isLoading && css.spinning, className)}
      data-testid="auto-renew-rounded-icon"
    />
  )
}

export type PortfolioRefreshHintViewProps = {
  isFetching: boolean
  timeAgo: string | null
  /** Seconds until the next refresh is allowed; undefined when not on cooldown. */
  cooldownSeconds?: number
  isDisabled: boolean
  onRefresh: () => void
}

export const PortfolioRefreshHintView = ({
  isFetching,
  timeAgo,
  cooldownSeconds,
  isDisabled,
  onRefresh,
}: PortfolioRefreshHintViewProps) => {
  const tooltip =
    cooldownSeconds !== undefined ? <>Next update available in {cooldownSeconds}s</> : 'Update portfolio data'

  return (
    <div className="flex items-center gap-1">
      <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
        {isFetching ? 'Fetching data' : timeAgo ? <>Updated {timeAgo} ago</> : 'Loading...'}
      </Typography>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRefresh}
            disabled={isDisabled}
            data-testid="portfolio-refresh-button"
            // eslint-disable-next-line no-restricted-syntax -- 20px circular icon button sized to the timestamp line; no size variant is this small or round
            className="size-5 rounded-full"
          >
            <RefreshIcon isLoading={isFetching} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </div>
  )
}
