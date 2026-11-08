import type { ReactElement } from 'react'
import { ExternalLinkIcon } from '@safe-global/views/components/common/ExternalLink/ExternalLinkIcon'
import { Typography } from '@safe-global/views/components/ui/typography'
import type { HypernativeAuthStatus } from '@/features/hypernative'
import { HYPERNATIVE_EVENTS, trackEvent } from '@/services/analytics'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'

// Passed only for Safes eligible for Hypernative (guard or allowlist)
export const HypernativeLoginLine = ({
  hypernativeAuth,
}: {
  hypernativeAuth?: HypernativeAuthStatus
}): ReactElement | null => {
  if (!hypernativeAuth) return null

  const { isAuthenticated, isTokenExpired, isSessionRejected, initiateLogin } = hypernativeAuth
  if (isAuthenticated && !isTokenExpired) return null

  const login = () => {
    trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
      [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Copilot,
    })
    initiateLogin()
  }

  if (isSessionRejected) {
    return (
      <Typography
        variant="paragraph-mini"
        align="center"
        className="flex flex-col items-center gap-1 py-2 text-[var(--color-primary-light)]"
        data-testid="hypernative-reconnect-line"
      >
        Please reconnect your Hypernative account to review this transaction&apos;s risks.
        <button
          type="button"
          onClick={login}
          className="flex cursor-pointer items-center gap-1 font-semibold underline"
        >
          Reconnect to Hypernative
          <ExternalLinkIcon className="size-3.5" aria-hidden />
        </button>
      </Typography>
    )
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
