import TxLayout from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '../../useTxStepper'
import CreateTokenTransfer from './CreateTokenTransfer'
import ReviewTokenTx from '@/components/tx-flow/flows/TokenTransfer/ReviewTokenTx'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TokenAmountFields } from '@/components/common/TokenAmountInput'

export enum TokenTransferType {
  multiSig = 'multiSig',
  spendingLimit = 'spendingLimit',
}

enum Fields {
  recipient = 'recipient',
  type = 'type',
}

export const TokenTransferFields = { ...Fields, ...TokenAmountFields }

export type TokenTransferParams = {
  [TokenTransferFields.recipient]: string
  [TokenTransferFields.tokenAddress]: string
  [TokenTransferFields.amount]: string
}

enum MultiTransfersFields {
  recipients = 'recipients',
  type = 'type',
}

export const MultiTokenTransferFields = { ...MultiTransfersFields }

export type MultiTokenTransferParams = {
  recipients: TokenTransferParams[]
  [TokenTransferFields.type]: TokenTransferType
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
  const { data, step, nextStep, prevStep } = useTxStepper<MultiTokenTransferParams>({
    ...defaultParams,
    recipients: params.recipients
      ? params.recipients.map((recipient) => ({
          ...defaultParams.recipients[0],
          ...recipient,
        }))
      : defaultParams.recipients,
  })

  const steps = [
    <CreateTokenTransfer
      key={0}
      params={data}
      txNonce={txNonce}
      onSubmit={(formData) => {
        console.log('🚀 ~ TokenTransferFlow ~ formData:', formData)
        nextStep({ ...data, ...formData })
      }}
    />,

    <ReviewTokenTx key={1} params={data} txNonce={txNonce} onSubmit={() => null} />,
  ]

  return (
    <TxLayout
      title={step === 0 ? 'New transaction' : 'Confirm transaction'}
      subtitle="Send tokens"
      icon={AssetsIcon}
      step={step}
      onBack={prevStep}
    >
      {steps}
    </TxLayout>
  )
}

export default TokenTransferFlow
