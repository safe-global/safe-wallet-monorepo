import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import EthHashInfo from '@/components/common/EthHashInfo'
import useWallet from '@/hooks/wallets/useWallet'
import ChainIndicator from '@/components/common/ChainIndicator'
import { Typography } from '@/components/ui/typography'
import PolicyStatusChip from '../PoliciesTable/components/PolicyStatusChip'
import AllowanceUsage from './components/AllowanceUsage'
import PolicyActiveFooter from './components/PolicyActiveFooter'
import PolicyEnforcement from './components/PolicyEnforcement'
import PolicyPendingBanner from './components/PolicyPendingBanner'
import PolicyPendingFooter from './components/PolicyPendingFooter'
import PolicyLimits, { type AllowanceDetail } from './components/PolicyLimits'
import PolicyMetadataRow from './components/PolicyMetadataRow'
import PolicyTypeDetails from './components/PolicyTypeDetails'
import { getPolicyLabel } from '../utils/policyLabel'
import { getPolicyIcon } from '../utils/policyIcon'
import { formatPolicyDateTime } from '../utils/policyTime'
import { getPolicyPendingState } from '../utils/policyPendingState'
import { getPolicyActiveState } from '../utils/policyActiveState'
import { getPolicyStatus, hasSpendingLimitData, isPendingPolicy, type Policy } from '../types'

export type PolicyDetailPanelProps = {
  policy: Policy | null
  onClose: () => void
  /** The owners of the Safe the policy applies to, used to decide which active state applies. */
  signers?: string[]
  onEdit?: (policy: Policy) => void
  onDelete?: (policy: Policy) => void
  onSign?: (policy: Policy) => void
  onExecute?: (policy: Policy) => void
  /** Link to the queued transaction, for a signer to pass to the signers still outstanding. */
  transactionLink?: string
  /** True when the queued transaction was rejected, replaced, or lost its nonce. */
  isTransactionUnavailable?: boolean
  /** Replaces the usage rendered under each allowance. */
  renderAllowanceDetail?: AllowanceDetail
  /** Rendered above the content. WA-3460 supplies it for pending policies. */
  banner?: ReactNode
  /** Replaces the footer this component resolves, for example with the pending states. */
  footer?: ReactNode
}

/**
 * The detail panel, opened from a table row. The list stays behind it and the page does not change,
 * so the reader keeps their place in the table.
 *
 * This component owns the layout only. The banner and the footer differ per policy state and are
 * passed in by WA-3460 and WA-3461, which keeps one layout instead of one per state.
 */
const PolicyDetailPanel = ({
  policy,
  onClose,
  signers = [],
  onEdit,
  onDelete,
  onSign,
  onExecute,
  transactionLink = '',
  isTransactionUnavailable = false,
  renderAllowanceDetail,
  banner,
  footer,
}: PolicyDetailPanelProps) => {
  const wallet = useWallet()

  if (!policy) return null

  const Icon = getPolicyIcon(policy.type)
  const isPending = isPendingPolicy(policy)

  // A pending policy enforces nothing yet, so no amount has been spent against it.
  const allowanceDetail =
    renderAllowanceDetail ??
    (isPending ? undefined : (allowance) => <AllowanceUsage key={allowance.token.address} allowance={allowance} />)

  const isSigner = getPolicyActiveState(wallet?.address, signers) === 'signer'

  const pendingState = isPending
    ? getPolicyPendingState(policy, wallet?.address, isSigner, isTransactionUnavailable)
    : 'no-wallet'

  const resolvedFooter =
    footer ??
    (isPending ? (
      <PolicyPendingFooter
        policy={policy}
        state={pendingState}
        transactionLink={transactionLink}
        onSign={onSign && (() => onSign(policy))}
        onExecute={onExecute && (() => onExecute(policy))}
      />
    ) : (
      <PolicyActiveFooter
        policy={policy}
        signers={signers}
        onEdit={onEdit && (() => onEdit(policy))}
        onDelete={onDelete && (() => onDelete(policy))}
      />
    ))

  return (
    <Sheet
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <SheetContent
        side="right"
        size="md"
        variant="floating"
        surface="muted"
        padding="none"
        className="flex flex-col"
        data-testid="policy-detail-panel"
      >
        <header className="flex items-center gap-2 px-4 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent">
            <Icon className="size-4 text-accent-success" aria-hidden />
          </div>

          <SheetTitle className="min-w-0 flex-1 truncate text-base font-bold">{getPolicyLabel(policy)}</SheetTitle>

          <PolicyStatusChip status={getPolicyStatus(policy)} />
        </header>

        {banner ?? (isPending ? <PolicyPendingBanner policy={policy} state={pendingState} /> : null)}

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          {hasSpendingLimitData(policy) && (
            <PolicyLimits
              spenders={policy.data.spenders}
              chainId={policy.safe.chainId}
              renderAllowanceDetail={allowanceDetail}
            />
          )}

          <PolicyTypeDetails policy={policy} />

          <section className="flex flex-col rounded-lg bg-card" aria-label="Policy details">
            <PolicyMetadataRow label="Created by">
              <EthHashInfo
                address={policy.createdBy}
                chainId={policy.safe.chainId}
                shortAddress
                showPrefix={false}
                showCopyButton
                avatarSize={20}
              />
            </PolicyMetadataRow>

            <PolicyMetadataRow label="Creation time">
              <Typography variant="paragraph-small">{formatPolicyDateTime(policy.createdAt)}</Typography>
            </PolicyMetadataRow>

            <PolicyMetadataRow label="Applies to">
              <EthHashInfo
                address={policy.safe.address}
                chainId={policy.safe.chainId}
                shortAddress
                showPrefix={false}
                showCopyButton
                avatarSize={20}
              />
            </PolicyMetadataRow>

            <PolicyMetadataRow label="Network">
              <ChainIndicator chainId={policy.safe.chainId} showUnknown inline />
            </PolicyMetadataRow>

            <PolicyMetadataRow label="Enforced by">
              <PolicyEnforcement policy={policy} />
            </PolicyMetadataRow>
          </section>
        </div>

        {resolvedFooter}
      </SheetContent>
    </Sheet>
  )
}

export default PolicyDetailPanel
