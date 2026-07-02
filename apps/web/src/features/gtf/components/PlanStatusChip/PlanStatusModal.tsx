import { type ReactElement } from 'react'
import Link from 'next/link'
import { Dialog, IconButton } from '@mui/material'
import { ChartLine, ChevronDown, Fuel, Receipt, X } from 'lucide-react'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { useCurrentSpaceId } from '@/features/spaces'
import Identicon from '@/components/common/Identicon'
import type { PlanStatus } from './types'
import { getModalContent } from './modalContent'
import StatusPill from './StatusPill'
import UsageRow from './UsageRow'
import ComparisonCards from './ComparisonCards'
import css from './PlanStatusModal.module.css'

const PAYG_URL = 'https://safe.global/pricing'

const usd = (value: number): string => formatCurrency(value, 'USD', 4)

const formatRenewal = (plan: PlanStatus): string =>
  plan.status === 'payment_failed'
    ? 'Renewal failed'
    : `Renews on ${new Date(plan.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

const SafesSelector = ({ safes }: { safes: string[] }): ReactElement => {
  const shown = safes.slice(0, 3)
  const overflow = safes.length - shown.length

  return (
    <button type="button" className={css.safesSelector} data-testid="plan-safes-selector">
      <span className={css.avatarStack}>
        {shown.map((address) => (
          <span key={address} className={css.avatar}>
            <Identicon address={address} size={20} />
          </span>
        ))}
        {overflow > 0 && <span className={css.avatarMore}>+{overflow}</span>}
      </span>
      <span className={css.safesLabel}>Active on {safes.length} Safes</span>
      <ChevronDown size={16} />
    </button>
  )
}

const WorkspacePromo = (): ReactElement => (
  <div className={css.promo} data-testid="plan-workspace-promo">
    <p className={css.promoTitle}>Plans live in Workspaces</p>
    <p className={css.promoText}>
      Plans are billed at the Workspace level. Create a Workspace to unlock fee-free volume, gasless transactions and
      flat pricing.
    </p>
  </div>
)

const PlanStatusModal = ({
  open,
  onClose,
  planStatus,
}: {
  open: boolean
  onClose: () => void
  planStatus: PlanStatus
}): ReactElement => {
  const spaceId = useCurrentSpaceId()
  const content = getModalContent(planStatus, spaceId)
  const { feeFreeVolume, gaslessTransactions, paygFeesThisPeriodUsd, activeSafes } = planStatus

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{ paper: { className: css.paper } }}
      data-testid="plan-status-modal"
    >
      <div className={css.container}>
        <div className={css.headerRow}>
          <StatusPill status={planStatus.status} />
          <IconButton aria-label="close" onClick={onClose} size="small" className={css.close}>
            <X size={16} />
          </IconButton>
        </div>

        {planStatus.belongsToWorkspace ? (
          <>
            <div className={css.planLine}>
              <span className={css.planHeading}>
                <span className={css.planTitle}>{planStatus.planName}</span>
                <span className={css.renewal}>· {formatRenewal(planStatus)}</span>
              </span>
              {content.showSafesSelector && <SafesSelector safes={activeSafes} />}
            </div>

            <div className={css.tiles}>
              <UsageRow
                icon={<ChartLine size={20} strokeWidth={1.5} />}
                label="Fee-free volume remaining:"
                used={feeFreeVolume.used}
                total={feeFreeVolume.total}
                format={usd}
                testId="plan-usage-volume"
                withStatusDot
              />
              {gaslessTransactions && (
                <UsageRow
                  icon={<Fuel size={20} strokeWidth={1.5} />}
                  label="Gasless transactions remaining:"
                  used={gaslessTransactions.used}
                  total={gaslessTransactions.total}
                  format={String}
                  testId="plan-usage-gasless"
                />
              )}
              {paygFeesThisPeriodUsd != null && (
                <div className={css.row} data-testid="plan-payg-fees">
                  <div className={css.rowLabel}>
                    <span className={css.rowIcon}>
                      <Receipt size={20} strokeWidth={1.5} />
                    </span>
                    Pay-as-you-go fees this period:
                  </div>
                  <span className={css.rowRemaining}>{usd(paygFeesThisPeriodUsd)}</span>
                </div>
              )}
            </div>

            {content.showPaygFootnote && (
              <p className={css.paygFootnote}>
                Transactions above your included volume are billed at{' '}
                <a href={PAYG_URL} target="_blank" rel="noreferrer" className={css.paygLink}>
                  pay-as-you-go rates
                </a>
                .
              </p>
            )}

            {content.comparison && <ComparisonCards comparison={content.comparison} />}
          </>
        ) : (
          <WorkspacePromo />
        )}

        <Link href={content.cta.href} className={css.cta} onClick={onClose} data-testid="plan-cta">
          {content.cta.label}
        </Link>
      </div>
    </Dialog>
  )
}

export default PlanStatusModal
