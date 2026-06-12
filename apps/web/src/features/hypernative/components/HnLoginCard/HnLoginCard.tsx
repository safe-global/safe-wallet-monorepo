import type { ReactElement } from 'react'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { useHypernativeOAuth } from '../../hooks/useHypernativeOAuth'
import ExternalLink from '@/components/common/ExternalLink'
import AlertIcon from '@/public/images/common/alert.svg'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

export const HnLoginCard = (): ReactElement | null => {
  const isSafeOwner = useIsSafeOwner()
  const { isAuthenticated, isTokenExpired, initiateLogin } = useHypernativeOAuth()

  const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    e.stopPropagation()
    trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
      [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Queue,
    })
    initiateLogin()
  }

  // Only show login card if the connected wallet is a signer of the Safe
  if (!isSafeOwner) {
    return null
  }

  // Show login card if user is not authenticated or token is expired
  // UI updates automatically when auth token cookie is set (polled every 1 second)
  const showLoginCard = !isAuthenticated || isTokenExpired

  if (showLoginCard) {
    return (
      <Alert variant="warning" className="min-w-[303px] items-center px-4 py-0">
        <AlertIcon className="size-4 text-[var(--color-warning-main)]" />
        <AlertDescription>Hypernative not connected.</AlertDescription>
        <AlertAction>
          <ExternalLink href="#" onClick={handleLogin}>
            Log in
          </ExternalLink>
        </AlertAction>
      </Alert>
    )
  }

  return (
    <div className="flex flex-row items-center gap-1 py-2 pr-4">
      <HypernativeIcon className="size-4 text-[var(--color-primary-main)]" />
      <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
        Logged in to Hypernative
      </Typography>
    </div>
  )
}
