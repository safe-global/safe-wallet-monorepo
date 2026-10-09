import type { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DataRow } from '@/components/common/Table/DataRow'
import { getPeriod } from '@safe-global/utils/utils/date'

export const PartDuration = ({ order }: { order: Pick<TwapOrderTransactionInfo, 'timeBetweenParts'> }) => {
  const { timeBetweenParts } = order
  return (
    <DataRow title="Part duration" key="part_duration">
      {getPeriod(+timeBetweenParts)}
    </DataRow>
  )
}
