import type { ReactElement, ReactNode } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { MIN_POLICY_GUARD_SAFE_VERSION } from '@safe-global/utils/features/policy-guard/constants'
import { POLICY_CHANGE_DELAY } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import AllowlistAlert from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistAlert'

export type GuardSlotName = 'transaction' | 'module'

/** The policy guard states, plus what a read adds: still reading, failed, or a Safe CGW doesn't know yet. */
export type GuardStatus =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'none' }
  | { status: 'known' }
  | { status: 'partial'; missingSlot: GuardSlotName }
  | { status: 'unknown'; foreignGuards: { slot: GuardSlotName; address: string }[] }
  | { status: 'unsupported' }
  | { status: 'not-activated' }

export type GuardStatusBannerProps = {
  guard: GuardStatus
  safeName: string
  onRetry?: () => void
}

const BANNER_TONES = { info: 'info', success: 'success', warning: 'warning', destructive: 'error' } as const

const Banner = ({
  variant,
  title,
  children,
  action,
}: {
  variant: keyof typeof BANNER_TONES
  title: string
  children: ReactNode
  action?: ReactNode
}): ReactElement => (
  <AllowlistAlert
    tone={BANNER_TONES[variant]}
    title={title}
    description={<div className="flex flex-col gap-3">{children}</div>}
    action={action}
    data-testid={`guard-status-${variant}`}
  />
)

const GuardStatusBanner = ({ guard, safeName, onRetry }: GuardStatusBannerProps): ReactElement => {
  switch (guard.status) {
    case 'loading':
      return (
        <AllowlistAlert
          tone="loading"
          title={`Checking guards on ${safeName}…`}
          aria-live="polite"
          data-testid="guard-status-loading"
        />
      )

    case 'none':
      return (
        <Banner variant="info" title="The Safe policy guard isn't enabled yet">
          This transaction also enables it, so the recipient allowlist is active right after execution.
        </Banner>
      )

    case 'known':
      return (
        <Banner variant="success" title="The Safe policy guard is already enabled">
          Only the policy change is sent. It waits {POLICY_CHANGE_DELAY}, then needs an activation step before it
          applies.
        </Banner>
      )

    case 'unknown':
      return (
        <Banner
          variant="destructive"
          title="This Safe account has an unknown policy installed"
          action={
            <ExternalLink href={HelpCenterArticle.TRANSACTION_GUARD} mode="button">
              How to remove it
            </ExternalLink>
          }
        >
          Remove it to set up an allowlist.
        </Banner>
      )

    case 'partial':
      return (
        <Banner variant="warning" title="The Safe policy guard is only partly enabled">
          {guard.missingSlot === 'module' ? (
            <div>
              It checks transactions signed by the owners, but the module guard slot isn&apos;t set, so transactions
              sent through modules skip your policies. You can set the module guard later in this flow.
            </div>
          ) : (
            <div>
              It checks transactions sent through modules, but the transaction guard slot isn&apos;t set, so
              transactions signed by the owners skip your policies. This setup sets the transaction guard.
            </div>
          )}
        </Banner>
      )

    case 'unsupported':
      return (
        <Banner variant="destructive" title="This Safe account needs an update">
          Recipient allowlists need Safe v{MIN_POLICY_GUARD_SAFE_VERSION} or newer.
        </Banner>
      )

    case 'not-activated':
      return (
        <Banner variant="destructive" title="This Safe account isn't activated yet">
          Activate it with its first transaction, then set up the recipient allowlist.
        </Banner>
      )

    case 'error':
      return (
        <Banner
          variant="destructive"
          title={`Couldn't check the guards on ${safeName}`}
          action={
            onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            )
          }
        >
          Check your connection and try again.
        </Banner>
      )
  }
}

export default GuardStatusBanner
