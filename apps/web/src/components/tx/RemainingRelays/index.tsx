import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'
import { MAX_DAY_RELAYS } from '@/hooks/useRemainingRelays'
import css from '../BalanceInfo/styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'

const RemainingRelays = ({ relays, tooltip }: { relays?: RelaysRemaining; tooltip?: string }) => {
  if (!tooltip) {
    const limit = relays?.limit ?? MAX_DAY_RELAYS
    tooltip = `${limit} transaction${maybePlural(limit)} per day for free`
  }

  return (
    <div className={css.container}>
      <Typography variant="paragraph-small" className="flex items-center gap-1 text-[var(--color-primary-light)]">
        <b>{relays?.remaining ?? MAX_DAY_RELAYS}</b> free transactions left today
        <Tooltip>
          <TooltipTrigger
            render={
              <span style={{ lineHeight: 0 }}>
                <InfoIcon className="size-4 text-[#B2B5B2]" />
              </span>
            }
          />
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </Typography>
    </div>
  )
}

export default RemainingRelays
