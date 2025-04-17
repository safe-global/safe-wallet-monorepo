import ExternalLink from '@/components/common/ExternalLink'
import ActivateAccountButton from '@/features/counterfactual/ActivateAccountButton'
import Track from '@/components/common/Track'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { COUNTERFACTUAL_EVENTS } from '@/services/analytics/events/counterfactual'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { Alert, Typography } from '@mui/material'

const CheckBalance = () => {
  const { safe, safeAddress } = useSafeInfo()
  const chain = useCurrentChain()

  if (safe.deployed) return null

  const blockExplorerLink = chain ? getBlockExplorerLink(chain, safeAddress) : undefined

  return (
    <Alert
      data-testid="no-tokens-alert"
      icon={false}
      severity="info"
      sx={{ display: 'flex', maxWidth: '600px', mt: 3, px: 3, py: 2, mx: 'auto' }}
    >
      <Typography fontWeight="bold" mb={1}>
        Don&apos;t see your tokens?
      </Typography>
      <Typography variant="body2" mb={2}>
        Your Safe Account is not activated yet so we can only display your native balance. Non-native tokens may not
        show up immediately after the Safe is deployed. Finish the onboarding to deploy your account onchain and unlock
        all features.{' '}
        {blockExplorerLink && (
          <>
            You can always view all of your assets on the{' '}
            <Track {...COUNTERFACTUAL_EVENTS.CHECK_BALANCES}>
              <ExternalLink href={blockExplorerLink.href}>Block Explorer</ExternalLink>
            </Track>
          </>
        )}
      </Typography>

      <ActivateAccountButton />
    </Alert>
  )
}

export default CheckBalance
