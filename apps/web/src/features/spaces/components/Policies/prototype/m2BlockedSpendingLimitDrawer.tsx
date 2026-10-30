import type { ReactElement } from 'react'
import { Drawer, DrawerBody, DrawerHeader, DrawerTitle } from '@/components/common/Drawer'
import { MOCK_VIEWERS } from '../mocks/policies'
import { SpendingLimitActions } from '../SpendingLimitDrawer/components/SpendingLimitActions'
import { SpendingLimits } from '../SpendingLimitDrawer/components/SpendingLimits'
import {
  resolveSpendingLimitDrawerState,
  type SpendingLimitDrawerState,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/resolveState'
import { getPolicyIcon } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import { getPolicyLabel } from '@safe-global/views/features/spaces/components/Policies/utils/policyLabel'
import type { SpendingLimitMock } from './m2AccountPanel'
import { M2Alert } from './m2Alert'
import { PanelNavButtons, PinnedTop, PolicyIconTile, type PanelNav } from './m2PanelParts'
import { RowStatusChip, type RowStatus } from './m2OverviewPage'

const LOCKED_HELPER = 'Locked by account protection.'

/** M1's active state with Edit disabled, so SpendingLimitActions shows its own disabled Edit with the reason under it. */
const LOCKED_STATE: SpendingLimitDrawerState = {
  kind: 'active',
  action: 'manage',
  disabled: true,
  helper: LOCKED_HELPER,
}

/** "USDC", "USDC and ETH", "USDC, ETH and DAI". */
const joinTokens = (tokens: string[]): string =>
  tokens.length < 2 ? tokens.join('') : `${tokens.slice(0, -1).join(', ')} and ${tokens[tokens.length - 1]}`

/** M1's PolicyDrawerHeader markup with the table's status chip, so the panel and its row always show the same badge. */
const SpendingLimitHeader = ({
  policy,
  status,
  nav,
  onOpenProtection,
}: {
  policy: SpendingLimitMock['policy']
  status: RowStatus
  nav?: PanelNav
  onOpenProtection?: () => void
}): ReactElement => (
  <DrawerHeader>
    <PolicyIconTile Icon={getPolicyIcon(policy.type)} onOpenProtection={onOpenProtection} />
    <div className="flex min-w-0 flex-col items-start gap-1">
      <DrawerTitle size="lg">{getPolicyLabel(policy)}</DrawerTitle>
      <RowStatusChip status={status} />
    </div>
    {nav && (
      <div className="ml-auto">
        <PanelNavButtons nav={nav} />
      </div>
    )}
  </DrawerHeader>
)

/** The account's protection, which checks every spending limit on the account. */
export type ProtectionLink = {
  onOpenProtection?: () => void
}

export type BlockedSpendingLimitDrawerProps = {
  open: boolean
  onClose: () => void
  onEdit?: () => void
  nav?: PanelNav
  limit: SpendingLimitMock
  /** Set when the account has protection. */
  protection?: ProtectionLink
} & (
  | {
      /** The allowlist leaves out the limit's tokens, so the limit can't be used. */
      variant: 'blocked'
      blockedTokens: string[]
      /** "See policy here". */
      onOpenAllowlist?: () => void
    }
  | {
      /** The allowlist applies to existing permissions, so the limit works but can't be edited. */
      variant: 'locked'
    }
  | {
      /** A working limit. */
      variant: 'covered'
    }
)

/** M1's SpendingLimitDrawer for one spender's limit, rebuilt so the allowlist can block it, lock its Edit, or show its coverage. */
export const BlockedSpendingLimitDrawer = (props: BlockedSpendingLimitDrawerProps): ReactElement => {
  const { open, onClose, onEdit, nav, limit, protection } = props
  const { policy, account, names } = limit
  const isBlocked = props.variant === 'blocked'
  const state =
    props.variant === 'locked'
      ? LOCKED_STATE
      : resolveSpendingLimitDrawerState(policy, MOCK_VIEWERS.signer, account.name)

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={getPolicyLabel(policy)}>
      <SpendingLimitHeader
        policy={policy}
        status={isBlocked ? 'blocked' : 'active'}
        nav={nav}
        onOpenProtection={protection?.onOpenProtection}
      />

      <DrawerBody>
        <div
          className="flex flex-col gap-6"
          data-m2-new="M1 copy · Spending limit panel (blocked / locked)"
          data-m2-new-corner="end"
        >
          <PinnedTop account={account}>
            {props.variant === 'covered' ? null : props.variant === 'blocked' ? (
              <M2Alert
                tone="error"
                title="This spending limit can't be used anymore"
                description={
                  <>
                    {account.name}’s allowlist doesn’t include {joinTokens(props.blockedTokens)}. Add{' '}
                    {joinTokens(props.blockedTokens)} to the allowlist to use it again.{' '}
                    {props.onOpenAllowlist && (
                      <button
                        type="button"
                        onClick={props.onOpenAllowlist}
                        className="cursor-pointer font-medium text-foreground underline underline-offset-2"
                      >
                        See allowlist
                      </button>
                    )}
                  </>
                }
              />
            ) : (
              <M2Alert
                tone="info"
                title="This spending limit is locked"
                description={`Account protection checks it on ${account.name}, so it can only change together with the allowlist.`}
              />
            )}
          </PinnedTop>
          <SpendingLimits spenders={policy.data.spenders} names={names} showUsage />
        </div>
      </DrawerBody>

      <SpendingLimitActions
        state={state}
        onConnectWallet={() => {}}
        onEdit={props.variant === 'locked' ? undefined : onEdit}
      />
    </Drawer>
  )
}
