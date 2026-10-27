import type { ReactElement, ReactNode } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import { MIN_POLICY_GUARD_SAFE_VERSION } from '@safe-global/utils/features/policy-guard/constants'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import ShortAddress from './ShortAddress'

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
  /** Leads to the Safe's settings, where an unknown guard can be removed. */
  settingsLink?: ReactNode
  /** The app's identity row for a guard address; its name and a short address without it. */
  renderAddress?: (address: string, name: string) => ReactNode
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
  <StatusAlert
    tone={BANNER_TONES[variant]}
    title={title}
    description={<div className="flex flex-col gap-3">{children}</div>}
    action={action}
    data-testid={`guard-status-${variant}`}
  />
)

const defaultRenderAddress = (address: string, name: string): ReactNode => (
  <div className="flex min-w-0 flex-col gap-0.5">
    <Typography variant="paragraph">{name}</Typography>
    <ShortAddress address={address} />
  </div>
)

const InstalledPolicies = ({
  addresses,
  renderAddress = defaultRenderAddress,
}: {
  addresses: string[]
  renderAddress?: (address: string, name: string) => ReactNode
}): ReactElement => (
  <section className="flex flex-col gap-3" data-testid="installed-policies">
    <Typography variant="paragraph">Installed policies</Typography>
    <ul className="m-0 flex list-none flex-col divide-y rounded-xl border p-0">
      {addresses.map((address, index) => (
        <li key={`${index}-${address}`} className="flex min-w-0 items-center gap-3 p-4">
          {renderAddress(address, addresses.length === 1 ? 'Unknown policy' : `Unknown policy ${index + 1}`)}
        </li>
      ))}
    </ul>
  </section>
)

const GuardStatusBanner = ({
  guard,
  safeName,
  settingsLink,
  renderAddress,
  onRetry,
}: GuardStatusBannerProps): ReactElement | null => {
  switch (guard.status) {
    case 'loading':
      return <StatusAlert tone="loading" title={`Checking guards on ${safeName}…`} data-testid="guard-status-loading" />

    // Setup works without a warning in these states
    case 'none':
    case 'known':
      return null

    case 'unknown':
      return (
        <div className="flex flex-col gap-5">
          <Banner variant="destructive" title="This Safe account has an unknown policy installed" action={settingsLink}>
            A Safe account can only have one policy of this kind, remove it to set up an allowlist.
          </Banner>
          <InstalledPolicies
            addresses={guard.foreignGuards.map(({ address }) => address)}
            renderAddress={renderAddress}
          />
        </div>
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
