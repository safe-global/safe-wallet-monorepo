import type { ReactElement } from 'react'
import { useHypernativeOAuth } from '../../hooks/useHypernativeOAuth'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { HnLoginCardView } from '@views/features/hypernative/components/HnLoginCard/HnLoginCardView'

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

  // UI updates automatically when auth token cookie is set (polled every 1 second)
  const showLoginCard = !isAuthenticated || isTokenExpired

  return <HnLoginCardView showLoginCard={showLoginCard} onLogin={handleLogin} />
}
