import { useRouter } from 'next/router'
import { useCallback, type MouseEvent } from 'react'
import { AppRoutes } from '@/config/routes'
import { AccountItemQueueActionsView } from '@views/features/myAccounts/components/AccountItem/AccountItemQueueActionsView'

export interface AccountItemQueueActionsProps {
  safeAddress: string
  chainShortName: string
  queued: number
  awaitingConfirmation: number
}

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
    <AccountItemQueueActionsView
      queued={queued}
      awaitingConfirmation={awaitingConfirmation}
      onQueueClick={onQueueClick}
    />
  )
}

export default AccountItemQueueActions
