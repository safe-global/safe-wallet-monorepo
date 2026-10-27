import { useId, useState, type ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Drawer, DrawerBody, DrawerHeader, DrawerSection, DrawerTitle } from '@/components/common/Drawer'
import { Button } from '@safe-global/views/components/ui/button'
import { Card } from '@safe-global/views/components/ui/card'
import { Label } from '@safe-global/views/components/ui/label'
import { Switch } from '@safe-global/views/components/ui/switch'
import { Typography } from '@safe-global/views/components/ui/typography'
import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '@/features/spaces/utils/safeHref'
import { useChain } from '@/hooks/useChains'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { getBlockExplorerLink } from '@/utils/chains'
import { MOCK_VIEWERS } from '../mocks/policies'
import { PolicyOverview } from '../SpendingLimitDrawer/components/PolicyOverview'
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
import { RowStatusChip, type Coverage, type RowStatus } from './m2OverviewPage'

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
}: {
  policy: SpendingLimitMock['policy']
  status: RowStatus
}): ReactElement => {
  const Icon = getPolicyIcon(policy.type)

  return (
    <DrawerHeader>
      <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-card">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <DrawerTitle size="lg">{getPolicyLabel(policy)}</DrawerTitle>
      <div className="ml-auto">
        <RowStatusChip status={status} />
      </div>
    </DrawerHeader>
  )
}

/** The account's protection as seen from one spending limit: whether it follows it, and the tokens it doesn't allow. */
export type ProtectionLink = {
  coverage: Coverage
  /** Tokens the account's protection doesn't allow. */
  excludedTokens: string[]
  onOpenProtection?: () => void
}

export type BlockedSpendingLimitDrawerProps = {
  open: boolean
  onClose: () => void
  onEdit?: () => void
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
      /** A working limit on an account with protection: the panel shows whether it follows it. */
      variant: 'covered'
    }
)

/** Turning the switch is a change to the account like any other: it needs signatures and waits out the delay. */
const ProtectionSection = ({
  protection,
  accountName,
  token,
  isBlocked,
}: {
  protection: ProtectionLink
  accountName: string
  token: string
  /** The panel's own banner already explains the blocked token, so this section doesn't repeat it. */
  isBlocked: boolean
}): ReactElement => {
  const [follows, setFollows] = useState(protection.coverage === 'follows')
  const switchId = useId()
  const isChanged = follows !== (protection.coverage === 'follows')
  const isTokenExcluded = protection.excludedTokens.includes(token)

  return (
    <DrawerSection title="Account protection">
      <Card variant="muted" size="none" radius="lg" data-m2-new="New · Spending limit follows protection">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-mint">
              <ShieldCheck className="size-4" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Label htmlFor={switchId}>Follow account protection</Label>
              <Typography variant="paragraph-small" color="muted">
                {follows
                  ? `Its transactions are checked by ${accountName}’s protection: only allowed tokens, only to allowed recipients.`
                  : 'Its transactions skip the protection: the spender can send its tokens to any address.'}
              </Typography>
            </div>
            <Switch id={switchId} checked={follows} onCheckedChange={setFollows} />
          </div>

          {/* pl-11: the icon tile's 32px plus the 12px gap, so the button lines up with the text. */}
          {protection.onOpenProtection && (
            <div className="pl-11">
              <Button variant="outline" size="sm" onClick={protection.onOpenProtection}>
                Open account protection
              </Button>
            </div>
          )}
        </div>
      </Card>

      {follows && isTokenExcluded && !isBlocked && (
        <M2Alert
          tone="warning"
          title={`${token} isn’t allowed by the protection`}
          description={`Following it would block this spending limit. Add ${token} to ${accountName}’s allowlist first.`}
        />
      )}
      {isChanged && (
        <M2Alert
          tone="info"
          title="This change needs signatures"
          description="Once executed, it applies after 24 hours, like any change to the account protection."
        />
      )}
    </DrawerSection>
  )
}

/** M1's SpendingLimitDrawer for one spender's limit, rebuilt so the allowlist can block it, lock its Edit, or show its coverage. */
export const BlockedSpendingLimitDrawer = (props: BlockedSpendingLimitDrawerProps): ReactElement => {
  const { open, onClose, onEdit, limit, protection } = props
  const { policy, account, names, overview } = limit
  const chain = useChain(policy.safe.chainId)
  const spaceId = useUrlSpaceId()
  const enforcedByHref =
    chain && policy.enforcement.via === 'module'
      ? getBlockExplorerLink(chain, policy.enforcement.moduleAddress)?.href
      : undefined
  const isBlocked = props.variant === 'blocked'
  const state =
    props.variant === 'locked'
      ? LOCKED_STATE
      : resolveSpendingLimitDrawerState(policy, MOCK_VIEWERS.signer, account.name)

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={getPolicyLabel(policy)}>
      <SpendingLimitHeader policy={policy} status={isBlocked ? 'blocked' : 'active'} />

      <DrawerBody>
        <div
          className="flex flex-col gap-6"
          data-m2-new="M1 copy · Spending limit panel (blocked / locked)"
          data-m2-new-corner="end"
        >
          {props.variant === 'covered' ? null : props.variant === 'blocked' ? (
            <M2Alert
              tone="error"
              title="This spending limit can't be used anymore"
              description={
                <>
                  It follows {account.name}’s protection, which doesn’t allow {joinTokens(props.blockedTokens)}. Add{' '}
                  {joinTokens(props.blockedTokens)} to the allowlist, or stop following the protection below.{' '}
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
              description={`It follows ${account.name}’s protection, so it can’t be changed. Stop following the protection below to edit it.`}
            />
          )}
          <SpendingLimits spenders={policy.data.spenders} names={names} showUsage />
          {protection && (
            <ProtectionSection
              protection={protection}
              accountName={account.name}
              token={limit.token}
              isBlocked={isBlocked}
            />
          )}
          <PolicyOverview
            {...overview}
            appliesTo={{
              address: account.address,
              name: account.name,
              href: buildSafeHref(AppRoutes.settings.setup, chain?.shortName, policy.safe.address, spaceId),
            }}
            chainId={policy.safe.chainId}
            enforcedBy={{ label: overview.enforcedBy, href: enforcedByHref }}
          />
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
