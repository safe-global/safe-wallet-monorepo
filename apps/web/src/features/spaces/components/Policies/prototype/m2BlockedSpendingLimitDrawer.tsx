import type { ReactElement } from 'react'
import { Drawer, DrawerBody, DrawerHeader, DrawerTitle } from '@/components/common/Drawer'
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
import { RowStatusChip, type RowStatus } from './m2OverviewPage'

const LOCKED_HELPER = 'Locked by the recipient allowlist.'

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
      <div className="flex size-10 items-center justify-center rounded-lg bg-success-subtle">
        <Icon className="size-4 text-success-strong" />
      </div>
      <DrawerTitle size="lg">{getPolicyLabel(policy)}</DrawerTitle>
      <div className="ml-auto">
        <RowStatusChip status={status} />
      </div>
    </DrawerHeader>
  )
}

export type BlockedSpendingLimitDrawerProps = {
  open: boolean
  onClose: () => void
  onEdit?: () => void
  limit: SpendingLimitMock
} & (
  | {
      /** The recipient allowlist leaves out the limit's tokens, so the limit can't be used. */
      variant: 'blocked'
      blockedTokens: string[]
      /** "See policy here". */
      onOpenAllowlist?: () => void
    }
  | {
      /** The recipient allowlist applies to existing permissions, so the limit works but can't be edited. */
      variant: 'locked'
    }
)

/** M1's SpendingLimitDrawer for one spender's limit, rebuilt so the allowlist can block it or lock its Edit. */
export const BlockedSpendingLimitDrawer = (props: BlockedSpendingLimitDrawerProps): ReactElement => {
  const { open, onClose, onEdit, limit } = props
  const { policy, account, names, overview } = limit
  const chain = useChain(policy.safe.chainId)
  const spaceId = useUrlSpaceId()
  const enforcedByHref =
    chain && policy.enforcement.via === 'module'
      ? getBlockExplorerLink(chain, policy.enforcement.moduleAddress)?.href
      : undefined
  const isBlocked = props.variant === 'blocked'
  const state = isBlocked ? resolveSpendingLimitDrawerState(policy, MOCK_VIEWERS.signer, account.name) : LOCKED_STATE

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={getPolicyLabel(policy)}>
      <SpendingLimitHeader policy={policy} status={isBlocked ? 'blocked' : 'active'} />

      <DrawerBody>
        <div
          className="flex flex-col gap-6"
          data-m2-new="M1 copy · Spending limit panel (blocked / locked)"
          data-m2-new-corner="end"
        >
          {props.variant === 'blocked' ? (
            <M2Alert
              tone="error"
              title="This spending limit can't be used anymore"
              description={
                <>
                  You have a policy that restricts sending of {joinTokens(props.blockedTokens)}.{' '}
                  {props.onOpenAllowlist && (
                    <button
                      type="button"
                      onClick={props.onOpenAllowlist}
                      className="cursor-pointer font-medium text-foreground underline underline-offset-2"
                    >
                      See policy here
                    </button>
                  )}
                </>
              }
            />
          ) : (
            <M2Alert
              tone="info"
              title="This spending limit is locked"
              description={`The recipient allowlist on ${account.name} applies to it, so it can't be changed. Turn that off in the allowlist to edit it.`}
            />
          )}
          <SpendingLimits spenders={policy.data.spenders} names={names} showUsage />
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

      <SpendingLimitActions state={state} onConnectWallet={() => {}} onEdit={isBlocked ? onEdit : undefined} />
    </Drawer>
  )
}
