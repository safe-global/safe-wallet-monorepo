import TxLayout from '@/components/tx-flow/common/TxLayout'
import SignMessage, { type SignMessageProps } from '@/components/tx-flow/flows/SignMessage/SignMessage'
import { getSwapTitle } from '@/features/swap'
import { selectSwapParams } from '@/features/swap/store/swapParamsSlice'
import { useAppSelector } from '@/store'
import { Box, Typography } from '@mui/material'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { ErrorBoundary } from '@sentry/react'
import { type BaseTransaction } from '@safe-global/safe-apps-sdk'
import { SWAP_TITLE } from '@/features/swap/constants'
import { STAKE_TITLE } from '@/features/stake/constants'
import { getStakeTitle } from '@/features/stake/helpers/utils'

const APP_LOGO_FALLBACK_IMAGE = '/images/apps/apps-icon.svg'
const APP_NAME_FALLBACK = 'Sign message'

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

  const appName = name || APP_NAME_FALLBACK
  const appLogo = logoUri || APP_LOGO_FALLBACK_IMAGE

  let title = appName
  if (name === SWAP_TITLE) {
    title = getSwapTitle(swapParams.tradeType, txs) || title
  }

  if (name === STAKE_TITLE) {
    title = getStakeTitle(txs) || title
  }

  return (
    <Box display="flex" alignItems="center">
      <SafeAppIconCard src={appLogo} alt={name || 'The icon of the application'} width={32} height={32} />
      <Typography variant="h4" pl={2} fontWeight="bold">
        {title}
      </Typography>
    </Box>
  )
}

const SignMessageFlow = ({ ...props }: SignMessageProps) => {
  return (
    <TxLayout
      title="Confirm message"
      subtitle={<AppTitle name={props.name} logoUri={props.logoUri} />}
      step={0}
      hideNonce
      isMessage
    >
      <ErrorBoundary fallback={<div>Error signing message</div>}>
        <SignMessage {...props} />
      </ErrorBoundary>
    </TxLayout>
  )
}

export default SignMessageFlow
