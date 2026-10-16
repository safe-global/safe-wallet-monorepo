import type { ReactElement, ReactNode } from 'react'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertSeverityIcon,
  AlertTitle,
} from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Typography } from '@safe-global/views/components/ui/typography'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { POLICY_CHANGE_DELAY } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

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
  /** The Safe's settings page, where a guard is removed. */
  settingsHref?: string
  onRetry?: () => void
}

const SLOT_LABELS: Record<GuardSlotName, string> = {
  transaction: 'Transaction guard',
  module: 'Module guard',
}

const OTHER_SLOT: Record<GuardSlotName, GuardSlotName> = { transaction: 'module', module: 'transaction' }

/** The settings page can only remove a transaction guard; a module guard needs a transaction of its own. */
const RemoveGuardHint = ({ slots, href }: { slots: GuardSlotName[]; href?: string }): ReactElement => (
  <>
    {slots.includes('transaction') && href && (
      <ExternalLink href={href}>Remove the transaction guard in the Safe account settings</ExternalLink>
    )}
    {slots.includes('module') && <span>Removing a module guard needs a transaction from this Safe account.</span>}
  </>
)

const Banner = ({
  variant,
  title,
  children,
  action,
}: {
  variant: 'info' | 'success' | 'destructive'
  title: string
  children: ReactNode
  action?: ReactNode
}): ReactElement => (
  <Alert variant={variant} data-testid={`guard-status-${variant}`}>
    <AlertSeverityIcon variant={variant} />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription className="flex flex-col gap-2">{children}</AlertDescription>
    {action && <AlertAction>{action}</AlertAction>}
  </Alert>
)

const GuardStatusBanner = ({ guard, safeName, settingsHref, onRetry }: GuardStatusBannerProps): ReactElement => {
  switch (guard.status) {
    case 'loading':
      return (
        <div className="flex items-center gap-2" data-testid="guard-status-loading">
          <Spinner className="size-4" />
          <Typography variant="paragraph-small" color="muted">
            Checking guards on {safeName}…
          </Typography>
        </div>
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
        <Banner variant="destructive" title="This Safe account has an unknown guard installed">
          <span>
            A Safe account can only have one guard, so you can&apos;t set up a recipient allowlist until it&apos;s
            removed.
          </span>
          <ul className="flex flex-col gap-1">
            {guard.foreignGuards.map(({ slot, address }) => (
              <li key={slot}>
                {SLOT_LABELS[slot]}: <span className="font-mono break-all text-foreground">{address}</span>
              </li>
            ))}
          </ul>
          <RemoveGuardHint slots={guard.foreignGuards.map(({ slot }) => slot)} href={settingsHref} />
        </Banner>
      )

    case 'partial':
      return (
        <Banner variant="destructive" title="The Safe policy guard is only partly enabled">
          <span>
            The {SLOT_LABELS[guard.missingSlot].toLowerCase()} slot isn&apos;t set. Remove the guard and try again.
          </span>
          <RemoveGuardHint slots={[OTHER_SLOT[guard.missingSlot]]} href={settingsHref} />
        </Banner>
      )

    case 'unsupported':
      return (
        <Banner variant="destructive" title="This Safe account needs an update">
          Recipient allowlists need Safe v1.5.0 or newer.
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
