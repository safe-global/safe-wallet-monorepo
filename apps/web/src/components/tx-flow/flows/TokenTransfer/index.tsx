import TxLayout from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '../../useTxStepper'
import CreateTokenTransfer from './CreateTokenTransfer'
import ReviewTokenTx from '@/components/tx-flow/flows/TokenTransfer/ReviewTokenTx'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TokenAmountFields } from '@/components/common/TokenAmountInput'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'

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
  [TokenTransferFields.type]: TokenTransferType
}

type TokenTransferFlowProps = Partial<TokenTransferParams> & {
  txNonce?: number
}

const defaultParams: TokenTransferParams = {
  recipient: '',
  tokenAddress: ZERO_ADDRESS,
  amount: '',
  type: TokenTransferType.multiSig,
}

const TokenTransferFlow = ({ txNonce, ...params }: TokenTransferFlowProps) => {
  const { data, step, nextStep, prevStep } = useTxStepper<TokenTransferParams>({
    ...defaultParams,
    ...params,
  })

  const steps = [
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
      content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
    },
  ]

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
