import { useRouter } from 'next/router'
import { type ReactNode, useCallback, type MouseEvent } from 'react'
import { Chip, Typography, SvgIcon } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import TransactionsIcon from '@/public/images/transactions/transactions.svg'
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

const ChipLink = ({ children, color }: { children: ReactNode; color?: string }) => (
  <Chip
    size="small"
    sx={{ backgroundColor: `${color}.background` }}
    label={
      <Typography
        variant="caption"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {children}
      </Typography>
    }
  />
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
            <SvgIcon component={TransactionsIcon} inheritViewBox sx={{ fontSize: 'small' }} />
            {queued} pending
          </ChipLink>
        )}

        {awaitingConfirmation > 0 && (
          <ChipLink color="warning">
            <SvgIcon component={CheckIcon} inheritViewBox sx={{ fontSize: 'small', color: 'warning' }} />
            {awaitingConfirmation} to confirm
          </ChipLink>
        )}
      </button>
    </Track>
  )
}

export default AccountItemQueueActions
