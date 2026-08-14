import { useRouter } from 'next/router'
import { type ReactNode, useCallback, type MouseEvent } from 'react'
import { CheckIcon } from 'lucide-react'
import TransactionsIcon from '@/public/images/transactions/transactions.svg'
import { Chip } from '@/components/ui/chip'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'

export interface AccountItemQueueActionsProps {
  safeAddress: string
  chainShortName: string
  queued: number
  awaitingConfirmation: number
}

const ChipLink = ({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'warning' }) => (
  <Chip variant={variant}>
    <span className="flex items-center gap-1">{children}</span>
  </Chip>
)

/**
 * Interactive queue action buttons with navigation to the queue page.
 * Renders pending transactions and confirmation chips.
 * For passive status display, use AccountItem.StatusChip instead.
 */
function AccountItemQueueActions({
  safeAddress,
  chainShortName,
  queued,
  awaitingConfirmation,
}: AccountItemQueueActionsProps) {
  const router = useRouter()

  const onQueueClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      router.push({
        pathname: AppRoutes.transactions.queue,
        query: { ...router.query, safe: `${chainShortName}:${safeAddress}` },
      })
    },
    [chainShortName, router, safeAddress],
  )

  if (!queued && !awaitingConfirmation) {
    return null
  }

  return (
    <Track {...OVERVIEW_EVENTS.OPEN_MISSING_SIGNATURES}>
      <button onClick={onQueueClick} className={css.queueButton}>
        {queued > 0 && (
          <ChipLink>
            <TransactionsIcon className="size-4" />
            {queued} pending
          </ChipLink>
        )}

        {awaitingConfirmation > 0 && (
          <ChipLink variant="warning">
            <CheckIcon className="size-4 text-[var(--color-warning-main)]" />
            {awaitingConfirmation} to confirm
          </ChipLink>
        )}
      </button>
    </Track>
  )
}

export default AccountItemQueueActions
