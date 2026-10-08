import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'
import css from '@/components/tx/BalanceInfo/styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export type RemainingRelaysViewProps = {
  remaining: number
  limit: number
  tooltip?: string
}

export const RemainingRelaysView = ({ remaining, limit, tooltip }: RemainingRelaysViewProps) => {
  const tooltipText = tooltip || `${limit} transaction${maybePlural(limit)} per day for free`

  return (
    <div className={css.container}>
      <Typography variant="paragraph-small" className="flex items-center gap-1 text-[var(--color-primary-light)]">
        <b>{remaining}</b> free transactions left today
        <Tooltip>
          <TooltipTrigger
            render={
              <span style={{ lineHeight: 0 }}>
                <InfoIcon className="size-4 text-[#B2B5B2]" />
              </span>
            }
          />
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      </Typography>
    </div>
  )
}
