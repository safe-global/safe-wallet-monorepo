import TxLayout from '@/components/tx-flow/common/TxLayout'
import SignMessage, { type SignMessageProps } from '@/components/tx-flow/flows/SignMessage/SignMessage'
import { getSwapTitle } from '@/features/swap'
import { selectSwapParams } from '@/features/swap/store/swapParamsSlice'
import { useAppSelector } from '@/store'
import { Box, SvgIcon, Typography } from '@mui/material'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { ErrorBoundary } from '@sentry/react'
import { type BaseTransaction } from '@safe-global/safe-apps-sdk'
import { SWAP_TITLE } from '@/features/swap/constants'
import { STAKE_TITLE, getStakeTitle } from '@/features/stake'
import { EARN_TITLE } from '@/features/earn'
import { isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'
import EarnIcon from '@/public/images/common/earn.svg'
import StakeIcon from '@/public/images/common/stake.svg'

const APP_LOGO_FALLBACK_IMAGE = '/images/apps/apps-icon.svg'
const APP_NAME_FALLBACK = 'Sign message'

/** Inline SVG to support currentColor in dark mode */
const InlineIcon = ({ name }: { name: string }) => {
  if (name === EARN_TITLE) {
    return <SvgIcon component={EarnIcon} inheritViewBox sx={{ width: 32, height: 32 }} />
  }
  if (name === STAKE_TITLE) {
    return <SvgIcon component={StakeIcon} inheritViewBox sx={{ width: 32, height: 32 }} />
  }
  return null
}

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
  const useInlineIcon = name === EARN_TITLE || name === STAKE_TITLE

  let title = appName
  if (name === SWAP_TITLE) {
    title = getSwapTitle(swapParams.tradeType, txs) || title
  }

  if (name === STAKE_TITLE) {
    title = getStakeTitle(txs) || title
  }

  return (
    <Box display="flex" alignItems="center">
      {useInlineIcon && name ? (
        <InlineIcon name={name} />
      ) : (
        <SafeAppIconCard src={appLogo} alt={name || 'The icon of the application'} width={32} height={32} />
      )}
      <Typography variant="h4" pl={2} fontWeight="bold">
        {title}
      </Typography>
    </Box>
  )
}

const SignMessageFlow = ({ message, ...props }: SignMessageProps) => {
  const isEip712 = isEIP712TypedData(message)

  return (
    <TxLayout
      title="Confirm message"
      subtitle={<AppTitle name={props.name} logoUri={props.logoUri} />}
      step={0}
      hideNonce
      isMessage
      hideSafeShield={!isEip712}
    >
      <ErrorBoundary fallback={<div>Error signing message</div>}>
        <SignMessage message={message} {...props} />
      </ErrorBoundary>
    </TxLayout>
  )
}

export default SignMessageFlow
