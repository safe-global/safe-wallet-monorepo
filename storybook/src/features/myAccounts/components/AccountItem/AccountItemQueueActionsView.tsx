import { type ReactNode, type MouseEvent } from 'react'
import { CheckIcon } from 'lucide-react'
import TransactionsIcon from '@/public/images/transactions/transactions.svg'
import { Chip } from '@/components/ui/chip'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import css from './styles.module.css'

const ChipLink = ({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'warning' }) => (
  <Chip variant={variant}>
    <span className="flex items-center gap-1">{children}</span>
  </Chip>
)

export type AccountItemQueueActionsViewProps = {
  queued: number
  awaitingConfirmation: number
  onQueueClick: (e: MouseEvent<HTMLButtonElement>) => void
}

export const AccountItemQueueActionsView = ({
  queued,
  awaitingConfirmation,
  onQueueClick,
}: AccountItemQueueActionsViewProps) => {
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
