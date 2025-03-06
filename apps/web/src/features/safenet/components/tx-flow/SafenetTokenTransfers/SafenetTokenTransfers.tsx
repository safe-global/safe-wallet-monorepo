import { TokenAmountFields } from '@/components/common/TokenAmountInput'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import CreateTokenTransfers from './CreateTokenTransfers'
import ReviewTokenTransfers from './ReviewTokenTransfers'

enum Fields {
  recipient = 'recipient',
}

export const TokenTransferFields = { ...Fields, ...TokenAmountFields }

export type TokenTransferParams = {
  [TokenTransferFields.recipient]: string
  [TokenTransferFields.tokenAddress]: string
  [TokenTransferFields.amount]: string
}

enum TransfersFields {
  recipients = 'recipients',
}

export const TokenTransfersFields = { ...TransfersFields }

export type TokenTransfersParams = {
  recipients: TokenTransferParams[]
}

type TokenTransferFlowProps = Partial<TokenTransfersParams> & {
  txNonce?: number
}

const defaultParams: TokenTransfersParams = {
  recipients: [
    {
      recipient: '',
      tokenAddress: ZERO_ADDRESS,
      amount: '',
    },
  ],
}

const SafenetTokenTransfersFlow = ({ txNonce, ...params }: TokenTransferFlowProps) => {
  const { data, step, nextStep, prevStep } = useTxStepper<TokenTransfersParams>({
    ...defaultParams,
    ...params,
  })

  const steps = [
    <CreateTokenTransfers
      key={0}
      params={data}
      txNonce={txNonce}
      onSubmit={(formData) => nextStep({ ...data, ...formData })}
    />,
    <ReviewTokenTransfers key={1} params={data} txNonce={txNonce} onSubmit={() => null} />,
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

export default SafenetTokenTransfersFlow
