import type { ReactElement } from 'react'
import type { LinkProps } from 'next/link'
import { Drawer, DrawerBody } from '@/components/common/Drawer'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '@/features/spaces/utils/safeHref'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { getPolicyIcon } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import { getPolicyLabel } from '@safe-global/views/features/spaces/components/Policies/utils/policyLabel'
import { getPolicyTokens } from '@safe-global/views/features/spaces/components/Policies/utils/policyTokens'
import { getAllowlistRecipients } from '@safe-global/views/features/spaces/components/Policies/utils/allowlistRecipients'
import { PendingBanner } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/components/PendingBanner'
import {
  getPolicyStatus,
  type QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import type { Viewer } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/resolveState'
import {
  resolveAllowlistDrawerState,
  type ActiveAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/resolveState'
import { PolicyDrawerHeader } from '../components/PolicyDrawerHeader'
import { PendingSignatures } from '../SpendingLimitDrawer/components/PendingSignatures'
import { PolicyOverview } from '../SpendingLimitDrawer/components/PolicyOverview'
import AllowlistActions from './components/AllowlistActions'
import AllowlistRecipients from './components/AllowlistRecipients'
import AllowlistTokens from './components/AllowlistTokens'

type AllowlistDrawerBaseProps = {
  open: boolean
  onClose: () => void
  viewer: Viewer
  /** The Safe the allowlist applies to. The overview's "Safe account" row derives from it. */
  safe: { address: string; name?: string }
  overview: { lastUpdated?: string; enforcedBy: string }
  /** Address book names keyed by address, in any casing. */
  names?: Record<string, string>
  onConnectWallet: () => void
}

type ActiveAllowlistDrawerProps = AllowlistDrawerBaseProps & {
  policy: ActiveAllowlistPolicy
  onEdit?: () => void
  onRemove?: () => void
}

type PendingAllowlistDrawerProps = AllowlistDrawerBaseProps & {
  policy: QueuedAllowlistPolicy
  transactionLink?: string
  reviewTransactionHref?: LinkProps['href']
}

export type AllowlistDrawerProps = ActiveAllowlistDrawerProps | PendingAllowlistDrawerProps

const isPendingDrawer = (props: AllowlistDrawerProps): props is PendingAllowlistDrawerProps =>
  props.policy.status === 'pending'

const AllowlistDrawer = (props: AllowlistDrawerProps): ReactElement => {
  const { open, onClose, policy, viewer, safe, overview, names, onConnectWallet } = props
  const chain = useChain(policy.safe.chainId)
  const spaceId = useUrlSpaceId()
  const enforcedByHref =
    chain && policy.enforcement.via === 'guard'
      ? getBlockExplorerLink(chain, policy.enforcement.guardAddress)?.href
      : undefined

  const state = resolveAllowlistDrawerState(policy, viewer, safe.name ?? 'this Safe account')
  const Icon = getPolicyIcon(policy.type)
  const actions = isPendingDrawer(props)
    ? { transactionLink: props.transactionLink, reviewTransactionHref: props.reviewTransactionHref }
    : { onEdit: props.onEdit, onRemove: props.onRemove }

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={getPolicyLabel(policy)}>
      <PolicyDrawerHeader icon={Icon} title={getPolicyLabel(policy)} status={getPolicyStatus(policy)} />

      <DrawerBody>
        <div className="flex flex-col gap-6">
          {state.kind === 'pending' && (
            <>
              <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />
              <PendingSignatures safe={safe} signed={state.signed} required={state.required} />
            </>
          )}
          <AllowlistRecipients recipients={getAllowlistRecipients(policy.data)} names={names} />
          <AllowlistTokens tokens={getPolicyTokens(policy)} />
          <PolicyOverview
            {...overview}
            appliesTo={{
              ...safe,
              href: buildSafeHref(AppRoutes.settings.setup, chain?.shortName, policy.safe.address, spaceId),
            }}
            chainId={policy.safe.chainId}
            enforcedBy={{ label: overview.enforcedBy, href: enforcedByHref }}
          />
        </div>
      </DrawerBody>

      <AllowlistActions state={state} onConnectWallet={onConnectWallet} {...actions} />
    </Drawer>
  )
}

export default AllowlistDrawer
