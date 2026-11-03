import { type ReactElement } from 'react'
import RejectTx from './RejectTx'
import { TxFlowType } from '@/services/analytics/types'
import { TxFlow } from '../../TxFlow'

type RejectTxProps = {
  txNonce: number
}

const RejectTxFlow = ({ txNonce }: RejectTxProps): ReactElement => (
  <TxFlow
    subtitle="Reject"
    eventCategory={TxFlowType.REJECT_TX}
    ReviewTransactionComponent={RejectTx}
    isBatchable={false}
    txNonce={txNonce}
    isRejection
  />
)

export default RejectTxFlow
