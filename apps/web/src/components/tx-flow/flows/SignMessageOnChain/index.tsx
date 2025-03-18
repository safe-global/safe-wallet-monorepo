import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import { AppTitle } from '@/components/tx-flow/flows/SignMessage'
import ReviewSignMessageOnChain, {
  type SignMessageOnChainProps,
} from '@/components/tx-flow/flows/SignMessageOnChain/ReviewSignMessageOnChain'
import { useMemo } from 'react'
import useTxStepper from '../../useTxStepper'
import { ConfirmSignMessageOnChainDetails } from './ConfirmSignMessageOnChainDetails'

const SignMessageOnChainFlow = ({ props }: { props: Omit<SignMessageOnChainProps, 'onSubmit'> }) => {
  const { data, step, nextStep, prevStep } = useTxStepper(null)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm message' },
        content: <ReviewSignMessageOnChain {...props} key={0} onSubmit={() => nextStep(data)} />,
      },
      {
        txLayoutProps: { title: 'Confirm message details', fixedNonce: true },
        content: <ConfirmSignMessageOnChainDetails requestId={props.requestId} key={1} />,
      },
    ],
    [nextStep, data, props],
  )

  return (
    <TxLayout
      subtitle={<AppTitle name={props.app?.name} logoUri={props.app?.iconUrl} />}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}

export default SignMessageOnChainFlow
