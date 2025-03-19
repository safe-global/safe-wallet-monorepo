import type { SafeCollectibleResponse } from '@safe-global/safe-gateway-typescript-sdk'
import NftIcon from '@/public/images/common/nft.svg'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '../../useTxStepper'
import SendNftBatch from './SendNftBatch'
import ReviewNftBatch from './ReviewNftBatch'
import { useMemo } from 'react'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { TxFlowType } from '@/services/analytics'

export type NftTransferParams = {
  recipient: string
  tokens: SafeCollectibleResponse[]
}

type NftTransferFlowProps = Partial<NftTransferParams> & {
  txNonce?: number
}

const defaultParams: NftTransferParams = {
  recipient: '',
  tokens: [],
}

const NftTransferFlow = ({ txNonce, ...params }: NftTransferFlowProps) => {
  const { data, step, nextStep, prevStep } = useTxStepper<NftTransferParams>(
    {
      ...defaultParams,
      ...params,
    },
    TxFlowType.NFT_TRANSFER,
  )

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'New transaction' },
        content: <SendNftBatch key={0} params={data} onSubmit={(formData) => nextStep({ ...data, ...formData })} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction' },
        content: <ReviewNftBatch key={1} params={data} txNonce={txNonce} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={() => {}} />,
      },
    ],
    [nextStep, data, txNonce],
  )

  return (
    <TxLayout
      subtitle="Send NFTs"
      icon={NftIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default NftTransferFlow
