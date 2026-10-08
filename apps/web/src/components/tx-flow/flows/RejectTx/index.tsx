import { type ReactElement } from 'react'
import RejectTx from './RejectTx'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { REJECT_TX_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/RejectTx/copy'

type RejectTxProps = {
  txNonce: number
}

const RejectTxFlow = ({ txNonce }: RejectTxProps): ReactElement => (
  <TxFlow
    subtitle={COPY.subtitle}
    eventCategory={TxFlowType.REJECT_TX}
    ReviewTransactionComponent={RejectTx}
    isBatchable={false}
    txNonce={txNonce}
    isRejection
  />
)

export default RejectTxFlow
