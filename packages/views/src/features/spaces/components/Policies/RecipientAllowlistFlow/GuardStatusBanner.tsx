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
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { MIN_POLICY_GUARD_SAFE_VERSION } from '@safe-global/utils/features/policy-guard/constants'
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
  /** Leads to the Safe's settings, where a transaction guard can be removed. */
  settingsLink?: ReactNode
  /** The app's identity row for a guard address; a shortened address without it. */
  renderAddress?: (address: string) => ReactNode
  onRetry?: () => void
}

const SLOT_LABELS: Record<GuardSlotName, string> = {
  transaction: 'Transaction guard',
  module: 'Module guard',
}

const OTHER_SLOT: Record<GuardSlotName, GuardSlotName> = { transaction: 'module', module: 'transaction' }

const MODULE_GUARD_HINT = 'Removing a module guard needs a transaction from this Safe account.'

const defaultRenderAddress = (address: string): ReactNode => (
  <Typography variant="paragraph-mini" className="font-mono">
    {shortenAddress(address)}
  </Typography>
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
  <Alert
    variant={variant}
    outlined={false}
    // The success variant keeps a border even with `outlined={false}`
    className="border-transparent *:data-[slot=alert-description]:text-muted-foreground"
    data-testid={`guard-status-${variant}`}
  >
    <AlertSeverityIcon variant={variant} />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription className="flex flex-col gap-3">{children}</AlertDescription>
    {action && <AlertAction>{action}</AlertAction>}
  </Alert>
)

const GuardStatusBanner = ({
  guard,
  safeName,
  settingsLink,
  renderAddress = defaultRenderAddress,
  onRetry,
}: GuardStatusBannerProps): ReactElement => {
  switch (guard.status) {
    case 'loading':
      return (
        <Alert variant="subtle" data-testid="guard-status-loading">
          <Spinner />
          <AlertTitle>Checking guards on {safeName}…</AlertTitle>
        </Alert>
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

    case 'unknown': {
      const slots = guard.foreignGuards.map(({ slot }) => slot)
      return (
        <Banner variant="destructive" title="This Safe account has an unknown guard">
          <p>
            A Safe account can only have one guard, so you can&apos;t set up a recipient allowlist until it&apos;s
            removed.{slots.includes('module') && ` ${MODULE_GUARD_HINT}`}
          </p>
          <dl className="flex flex-col gap-2">
            {guard.foreignGuards.map(({ slot, address }) => (
              <div key={slot} className="flex items-center justify-between gap-3">
                <dt>{SLOT_LABELS[slot]}</dt>
                <dd className="min-w-0 text-foreground">{renderAddress(address)}</dd>
              </div>
            ))}
          </dl>
          {slots.includes('transaction') && settingsLink}
        </Banner>
      )
    }

    case 'partial': {
      const guardSlot = OTHER_SLOT[guard.missingSlot]
      return (
        <Banner variant="destructive" title="The Safe policy guard is only partly enabled">
          <p>
            The {SLOT_LABELS[guard.missingSlot].toLowerCase()} slot isn&apos;t set. Remove the guard and try again.
            {guardSlot === 'module' && ` ${MODULE_GUARD_HINT}`}
          </p>
          {guardSlot === 'transaction' && settingsLink}
        </Banner>
      )
    }

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
