import ExternalLink from '@/components/common/ExternalLink'
import ActivateAccountButton from '../ActivateAccountButton'
import Track from '@/components/common/Track'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { COUNTERFACTUAL_EVENTS } from '@/services/analytics/events/counterfactual'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { Alert } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'

const CheckBalance = () => {
  const { safe, safeAddress } = useSafeInfo()
  const chain = useCurrentChain()

  if (safe.deployed) return null

  const blockExplorerLink = chain ? getBlockExplorerLink(chain, safeAddress) : undefined

  return (
    <Alert data-testid="no-tokens-alert" className="mx-auto mt-6 flex max-w-[600px] flex-col px-6 py-4">
      <Typography variant="paragraph-bold" className="mb-2">
        Don&apos;t see your tokens?
      </Typography>
      <Typography variant="paragraph-small" className="block mb-4">
        Your Safe account is not activated yet so we can only display your native balance. Non-native tokens may not
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
