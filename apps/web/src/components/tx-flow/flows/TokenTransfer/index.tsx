import CreateTokenTransfer from './CreateTokenTransfer'
import ReviewTokenTx from '@/components/tx-flow/flows/TokenTransfer/ReviewTokenTx'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TokenAmountFields } from '@/components/common/TokenAmountInput'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import { useVisibleTokens } from './utils'

export enum TokenTransferType {
  multiSig = 'multiSig',
  spendingLimit = 'spendingLimit',
}

enum Fields {
  recipient = 'recipient',
}

export const TokenTransferFields = { ...Fields, ...TokenAmountFields }

export type TokenTransferParams = {
  [TokenTransferFields.recipient]: string
  [TokenTransferFields.tokenAddress]: string
  [TokenTransferFields.amount]: string
}

export enum MultiTransfersFields {
  recipients = 'recipients',
  type = 'type',
}

export const MultiTokenTransferFields = { ...MultiTransfersFields }

export type MultiTokenTransferParams = {
  [MultiTransfersFields.recipients]: TokenTransferParams[]
  [MultiTransfersFields.type]: TokenTransferType
}

type MultiTokenTransferFlowProps = {
  recipients?: Partial<TokenTransferParams>[]
  txNonce?: number
}

const TokenTransferFlow = ({ txNonce, ...params }: MultiTokenTransferFlowProps) => {
  const balancesItems = useVisibleTokens()

  const defaultParams: MultiTokenTransferParams = useMemo(
    () => ({
      recipients: [
        {
          recipient: '',
          tokenAddress: balancesItems.length > 0 ? balancesItems[0].tokenInfo.address : ZERO_ADDRESS,
          amount: '',
        },
      ],
      type: TokenTransferType.multiSig,
    }),
    [balancesItems],
  )

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
    [params.recipients, defaultParams],
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
