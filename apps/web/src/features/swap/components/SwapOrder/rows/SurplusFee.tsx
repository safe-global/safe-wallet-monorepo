import type { Order } from '@safe-global/safe-gateway-typescript-sdk'
import { getOrderFeeBps } from '@/features/swap/helpers/utils'
import { DataRow } from '@/components/common/Table/DataRow'
import { formatVisualAmount } from '@/utils/formatters'
import { HelpIconTooltip } from '@/features/swap/components/HelpIconTooltip'

export const SurplusFee = ({
  order,
}: {
  order: Pick<Order, 'fullAppData' | 'sellToken' | 'buyToken' | 'status' | 'executedSurplusFee' | 'kind'> & {
    // TODO: Remove when migrating to new SDK
    executedFee: string
    executedFeeToken: Order['sellToken']
  }
}) => {
  const bps = getOrderFeeBps(order)
  const { executedFee, executedFeeToken } = order

  if (executedFee === null || typeof executedFee === 'undefined' || executedFee === '0') {
    return null
  }

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
