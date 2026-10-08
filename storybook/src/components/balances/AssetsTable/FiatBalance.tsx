import FiatValue from '@/components/common/FiatValue'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

export const FiatBalance = ({ balanceItem }: { balanceItem: Balance }) => {
  const isMissingFiatConversion = balanceItem.fiatConversion === '0' && balanceItem.fiatBalance === '0'

  return (
    <div className="flex flex-row items-center justify-end gap-1">
      <FiatValue value={isMissingFiatConversion ? null : balanceItem.fiatBalance} />

      {isMissingFiatConversion && (
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <InfoIcon className="size-4 text-[var(--color-error-main)]" />
              </span>
            }
          />
          <TooltipContent>
            Provided values are indicative and we are unable to accommodate pricing requests for individual assets
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
