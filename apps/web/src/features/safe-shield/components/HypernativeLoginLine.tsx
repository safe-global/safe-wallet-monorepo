import type { ReactElement } from 'react'
import type { HypernativeAuthStatus } from '@/features/hypernative'
import { HYPERNATIVE_EVENTS, trackEvent } from '@/services/analytics'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HypernativeLoginLineView } from '@views/features/safe-shield/components/HypernativeLoginLineView'

// Passed only for Safes eligible for Hypernative (guard or allowlist)
export const HypernativeLoginLine = ({
  hypernativeAuth,
}: {
  hypernativeAuth?: HypernativeAuthStatus
}): ReactElement | null => {
  if (!hypernativeAuth) return null

  const { isAuthenticated, isTokenExpired, initiateLogin } = hypernativeAuth
  if (isAuthenticated && !isTokenExpired) return null

  const login = () => {
    trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
      [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Copilot,
    })
    initiateLogin()
  }

  return <HypernativeLoginLineView onLogin={login} />
}
