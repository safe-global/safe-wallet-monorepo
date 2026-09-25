import type { ReactElement } from 'react'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { useHypernativeOAuth } from '@/features/hypernative'
import { HYPERNATIVE_EVENTS, trackEvent } from '@/services/analytics'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'

export const HypernativeLoginLine = (): ReactElement | null => {
  const { isAuthenticated, isTokenExpired, initiateLogin } = useHypernativeOAuth()
  if (isAuthenticated && !isTokenExpired) return null

  const login = () => {
    trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
      [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Copilot,
    })
    initiateLogin()
  }

  return (
    <Typography
      variant="paragraph-mini"
      align="center"
      className="flex items-center justify-center gap-1 py-2 text-[var(--color-primary-light)]"
      data-testid="hypernative-login-line"
    >
      Already using Hypernative?{' '}
      <button type="button" onClick={login} className="cursor-pointer font-semibold underline">
        Log in
      </button>
      <ExternalLinkIcon className="size-3.5" aria-hidden />
    </Typography>
  )
}
