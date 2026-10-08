import type { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DataRow } from '@/components/common/Table/DataRow'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { HelpIconTooltip } from '@views/features/swap/components/HelpIconTooltip'

export type SurplusFeeViewProps = {
  bps: number
  executedFee: string
  executedFeeToken: TwapOrderTransactionInfo['executedFeeToken']
}

export const SurplusFeeView = ({ bps, executedFee, executedFeeToken }: SurplusFeeViewProps) => {
  return (
    <DataRow
      title={
        <>
          Total fees
          <HelpIconTooltip
            title={
              <>
                The amount of fees paid for this order.
                {bps > 0 && ` This includes a Widget fee of ${bps / 100}% and network fees.`}
              </>
            }
          />
        </>
      }
      key="widget_fee"
    >
      {formatVisualAmount(BigInt(executedFee), executedFeeToken.decimals)} {executedFeeToken.symbol}
    </DataRow>
  )
}
