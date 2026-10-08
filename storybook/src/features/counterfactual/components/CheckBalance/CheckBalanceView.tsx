import type { ReactNode } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import Track from '@/components/common/Track'
import { COUNTERFACTUAL_EVENTS } from '@/services/analytics/events/counterfactual'
import { Alert, AlertSeverityIcon } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'

export type CheckBalanceViewProps = {
  blockExplorerHref?: string
  activateAccountButton: ReactNode
}

export const CheckBalanceView = ({ blockExplorerHref, activateAccountButton }: CheckBalanceViewProps) => {
  return (
    <Alert data-testid="no-tokens-alert" variant="info" className="mx-auto mt-6 flex max-w-[600px] flex-col px-6 py-4">
      <AlertSeverityIcon variant="info" />
      <Typography variant="paragraph-bold" className="mb-2">
        Don&apos;t see your tokens?
      </Typography>
      <Typography variant="paragraph-small" className="block mb-4">
        Your Safe account is not activated yet so we can only display your native balance. Non-native tokens may not
        show up immediately after the Safe is deployed. Finish the onboarding to deploy your account onchain and unlock
        all features.{' '}
        {blockExplorerHref !== undefined && (
          <>
            You can always view all of your assets on the{' '}
            <Track {...COUNTERFACTUAL_EVENTS.CHECK_BALANCES}>
              <ExternalLink href={blockExplorerHref}>Block Explorer</ExternalLink>
            </Track>
          </>
        )}
      </Typography>

      {activateAccountButton}
    </Alert>
  )
}
