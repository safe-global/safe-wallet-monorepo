import TxLayout from '@/components/tx-flow/common/TxLayout'
import SignMessage, { type SignMessageProps } from '@/components/tx-flow/flows/SignMessage/SignMessage'
import { getSwapTitle } from '@/features/swap'
import { selectSwapParams } from '@/features/swap/store'
import { useAppSelector } from '@/store'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import { type BaseTransaction } from '@safe-global/safe-apps-sdk'
import { SWAP_TITLE } from '@/features/swap/constants'
import { STAKE_TITLE, getStakeTitle } from '@/features/stake'
import { EARN_TITLE } from '@/features/earn'
import { isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'
import { AppTitleView, SignMessageErrorFallbackView } from '@views/components/tx-flow/flows/SignMessage/AppTitleView'
import { SIGN_MESSAGE_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/SignMessage/copy'

export const AppTitle = ({
  name,
  logoUri,
  txs,
}: {
  name?: string | null
  logoUri?: string | null
  txs?: BaseTransaction[]
}) => {
  const swapParams = useAppSelector(selectSwapParams)

  const inlineIcon = name === EARN_TITLE ? 'earn' : name === STAKE_TITLE ? 'stake' : undefined

  let customTitle: string | undefined
  if (name === SWAP_TITLE) {
    customTitle = getSwapTitle(swapParams.tradeType, txs)
  }

  if (name === STAKE_TITLE) {
    customTitle = getStakeTitle(txs)
  }

  return <AppTitleView name={name} logoUri={logoUri} inlineIcon={inlineIcon} customTitle={customTitle} />
}

const SignMessageFlow = ({ message, ...props }: SignMessageProps) => {
  const isEip712 = isEIP712TypedData(message)

  return (
    <TxLayout
      title={COPY.title}
      subtitle={<AppTitle name={props.name} logoUri={props.logoUri} />}
      step={0}
      hideNonce
      isMessage
      hideSafeShield={!isEip712}
    >
      <ObservabilityErrorBoundary fallback={<SignMessageErrorFallbackView />}>
        <SignMessage message={message} {...props} />
      </ObservabilityErrorBoundary>
    </TxLayout>
  )
}

export default SignMessageFlow
