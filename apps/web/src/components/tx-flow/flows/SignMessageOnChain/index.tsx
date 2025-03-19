import TxLayout from '@/components/tx-flow/common/TxLayout'
import type { TxStep } from '../../common/TxLayout'
import { AppTitle } from '@/components/tx-flow/flows/SignMessage'
import ReviewSignMessageOnChain, {
  type SignMessageOnChainProps,
} from '@/components/tx-flow/flows/SignMessageOnChain/ReviewSignMessageOnChain'
import { useMemo } from 'react'
import useTxStepper from '../../useTxStepper'
import { ConfirmSignMessageOnChainDetails } from './ConfirmSignMessageOnChainDetails'
import { TxFlowType } from '@/services/analytics'

const SignMessageOnChainFlow = ({ props }: { props: Omit<SignMessageOnChainProps, 'onSubmit'> }) => {
  const { step, nextStep, prevStep } = useTxStepper(undefined, TxFlowType.SIGN_MESSAGE_ON_CHAIN)

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Confirm message' },
        content: <ReviewSignMessageOnChain {...props} key={0} onSubmit={() => nextStep(undefined)} />,
      },
      {
        txLayoutProps: { title: 'Confirm message details', fixedNonce: true },
        content: <ConfirmSignMessageOnChainDetails requestId={props.requestId} key={1} />,
      },
    ],
    [nextStep, props],
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
