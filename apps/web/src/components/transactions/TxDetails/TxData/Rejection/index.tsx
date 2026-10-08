import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NOT_AVAILABLE } from '@/components/transactions/TxDetails'
import React from 'react'
import { RejectionTxInfoView } from '@views/components/transactions/TxDetails/TxData/Rejection/RejectionTxInfoView'

interface Props {
  nonce?: MultisigExecutionDetails['nonce']
  isTxExecuted: boolean
}

const RejectionTxInfo = ({ nonce, isTxExecuted }: Props) => {
  const txNonce = nonce ?? NOT_AVAILABLE

  return <RejectionTxInfoView txNonce={txNonce} isTxExecuted={isTxExecuted} />
}

export default RejectionTxInfo
