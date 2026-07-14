import { type ReactElement } from 'react'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import SafeShieldLogo from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { HypernativeTooltip } from '../HypernativeTooltip'
import type { HypernativeAuthStatus } from '../../hooks/useHypernativeOAuth'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

export interface HnInfoCardProps {
  hypernativeAuth?: HypernativeAuthStatus
  showActiveStatus?: boolean
}

export const HnInfoCard = ({ hypernativeAuth, showActiveStatus = true }: HnInfoCardProps): ReactElement | null => {
  if (!hypernativeAuth) {
    return null
  }

  const { isAuthenticated, isTokenExpired, initiateLogin } = hypernativeAuth

  const showLoginCard = !isAuthenticated || isTokenExpired

  if (!showActiveStatus && !showLoginCard) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 px-3 pt-3 pb-4">
      {showActiveStatus && (
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <SafeShieldLogo className="size-4 [&_.shield-img]:fill-[var(--color-border-light)]" />
            <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
              Hypernative Guardian is active
            </Typography>
          </div>
          <HypernativeTooltip title="Hypernative Guardian is actively monitoring this transaction.">
            <InfoIcon className="size-4 text-[var(--color-border-main)]" />
          </HypernativeTooltip>
        </div>
      )}

      {showLoginCard && (
        <div className="rounded-[4px] bg-[var(--color-background-main)] p-4">
          <div className="flex flex-col gap-4">
            <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
              Log in to Hypernative to view the full analysis.
            </Typography>
            <Button
              variant="outline"
              onClick={() => {
                trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
                  [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Copilot,
                })
                initiateLogin()
              }}
              size="sm"
              className="w-fit"
            >
              Log in
              <ExternalLinkIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
