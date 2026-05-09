import type { ModuleTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import TxLayout from '@/components/tx-flow/common/TxLayout'
import { ReviewBatch } from './ReviewBatch'
import BatchIcon from '@/public/images/apps/batch-icon.svg'

export type ExecuteBatchFlowProps = {
  txs: ModuleTransaction[]
}

const ExecuteBatchFlow = (props: ExecuteBatchFlowProps) => {
  return (
    <TxLayout title="Confirm transaction" subtitle="Batch" icon={BatchIcon} hideNonce isBatch>
      <ReviewBatch params={props} />
    </TxLayout>
  )
}

export default ExecuteBatchFlow
