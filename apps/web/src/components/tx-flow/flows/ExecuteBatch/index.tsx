import type { ModuleTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import TxLayout from '@/components/tx-flow/common/TxLayout'
import { ReviewBatch } from './ReviewBatch'
import BatchIcon from '@/public/images/apps/batch-icon.svg'
import { EXECUTE_BATCH_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/ExecuteBatch/copy'

export type ExecuteBatchFlowProps = {
  txs: ModuleTransaction[]
}

const ExecuteBatchFlow = (props: ExecuteBatchFlowProps) => {
  return (
    <TxLayout title={COPY.title} subtitle={COPY.subtitle} icon={BatchIcon} hideNonce isBatch>
      <ReviewBatch params={props} />
    </TxLayout>
  )
}

export default ExecuteBatchFlow
