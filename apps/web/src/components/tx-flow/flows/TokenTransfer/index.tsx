import CreateTokenTransfer from './CreateTokenTransfer'
import ReviewTokenTx from '@/components/tx-flow/flows/TokenTransfer/ReviewTokenTx'
import TokenTransferSingleStep from './TokenTransferSingleStep'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { TokenTransferType, type MultiTokenTransferParams, type TokenTransferParams } from './types'

export {
  TokenTransferFields,
  TokenTransferType,
  MultiTransfersFields,
  MultiTokenTransferFields,
  type TokenTransferParams,
  type MultiTokenTransferParams,
} from './types'

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

  const canCreateStandardTx = useHasPermission(Permission.CreateTransaction)

  // Standard transfers use the one-screen flow. Spending-limit-only users keep the legacy
  // multi-step path (which still routes through ReviewSpendingLimitTx) until the single screen
  // gains spending-limit support.
  if (canCreateStandardTx) {
    return (
      <TxFlow
        initialData={initialData}
        icon={AssetsIcon}
        subtitle="Send tokens"
        eventCategory={TxFlowType.TOKEN_TRANSFER}
        hideDefaultSteps
      >
        <TokenTransferSingleStep txNonce={txNonce} />
      </TxFlow>
    )
  }

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
