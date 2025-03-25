import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import useTxStepper from '../../useTxStepper'
import CreateTokenTransfer from './CreateTokenTransfer'
import ReviewTokenTx from '@/components/tx-flow/flows/TokenTransfer/ReviewTokenTx'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TokenAmountFields } from '@/components/common/TokenAmountInput'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'

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
  const { data, step, nextStep, prevStep } = useTxStepper<MultiTokenTransferParams>(
    {
      ...defaultParams,
      recipients: params.recipients
        ? params.recipients.map((recipient) => ({
            ...defaultParams.recipients[0],
            ...recipient,
          }))
        : defaultParams.recipients,
    },
    TxFlowType.TOKEN_TRANSFER,
  )

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'New transaction' },
        content: (
          <CreateTokenTransfer
            key={0}
            params={data}
            txNonce={txNonce}
            onSubmit={(formData) => nextStep({ ...data, ...formData })}
          />
        ),
      },
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewTokenTx key={1} params={data} txNonce={txNonce} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} isMassPayout={data.recipients.length > 1} />,
      },
    ],
    [nextStep, data, txNonce],
  )

  return (
    <TxLayout
      subtitle="Send tokens"
      icon={AssetsIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default TokenTransferFlow
