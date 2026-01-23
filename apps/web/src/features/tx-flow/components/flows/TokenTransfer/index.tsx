import CreateTokenTransfer from './CreateTokenTransfer'
import ReviewTokenTx from '@/features/tx-flow/components/flows/TokenTransfer/ReviewTokenTx'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '@/features/tx-flow/components/TxFlow'
import { TxFlowStep } from '@/features/tx-flow/components/TxFlowStep'
import {
  TokenTransferType,
  TokenTransferFields,
  MultiTransfersFields,
  MultiTokenTransferFields,
  type TokenTransferParams,
  type MultiTokenTransferParams,
} from './types'

// Re-export types for consumers
export {
  TokenTransferType,
  TokenTransferFields,
  MultiTransfersFields,
  MultiTokenTransferFields,
}
export type { TokenTransferParams, MultiTokenTransferParams }

type MultiTokenTransferFlowProps = {
  recipients?: Partial<TokenTransferParams>[]
  txNonce?: number
}

const defaultParams: MultiTokenTransferParams = {
  recipients: [
    {
      recipient: '',
      tokenAddress: ZERO_ADDRESS,
      amount: '',
    },
  ],
  type: TokenTransferType.multiSig,
}

const TokenTransferFlow = ({ txNonce, ...params }: MultiTokenTransferFlowProps) => {
  const initialData = useMemo<MultiTokenTransferParams>(
    () => ({
      ...defaultParams,
      recipients: params.recipients
        ? params.recipients.map((recipient) => ({
            ...defaultParams.recipients[0],
            ...recipient,
          }))
        : defaultParams.recipients,
    }),
    [params.recipients],
  )

  return (
    <TxFlow
      initialData={initialData}
      icon={AssetsIcon}
      subtitle="Send tokens"
      eventCategory={TxFlowType.TOKEN_TRANSFER}
      ReviewTransactionComponent={ReviewTokenTx}
    >
      <TxFlowStep title="New transaction">
        <CreateTokenTransfer txNonce={txNonce} />
      </TxFlowStep>
    </TxFlow>
  )
}

export default TokenTransferFlow
