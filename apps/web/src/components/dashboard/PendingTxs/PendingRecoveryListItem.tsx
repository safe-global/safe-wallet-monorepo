import Link from 'next/link'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { ChevronRight } from 'lucide-react'
import type { ReactElement } from 'react'

import RecoveryInfo from '@safe-global/views/features/recovery/components/RecoveryInfo'
import RecoveryType from '@safe-global/views/features/recovery/components/RecoveryType'
import RecoveryStatus from '@/features/recovery/public/components/RecoveryStatus'
import { AppRoutes } from '@/config/routes'
import type { RecoveryQueueItem } from '@/features/recovery/public/types'

import css from '@safe-global/views/components/dashboard/PendingTxs/styles.module.css'
import classnames from 'classnames'

function PendingRecoveryListItem({ transaction }: { transaction: RecoveryQueueItem }): ReactElement {
  const router = useRouter()
  const { isMalicious } = transaction

  const url = useMemo(
    () => ({
      pathname: AppRoutes.transactions.queue,
      query: router.query,
    }),
    [router.query],
  )

  return (
    <Link href={url} passHref>
      <div className={classnames(css.container, css.recoveryContainer, 'min-h-[50px]')}>
        <RecoveryType isMalicious={isMalicious} date={transaction.timestamp} isDashboard />

        <RecoveryInfo isMalicious={isMalicious} />

        <div className="ml-auto flex flex-row items-center gap-3">
          <RecoveryStatus recovery={transaction} />
          <ChevronRight className="size-5 text-[var(--color-border-main)]" />
        </div>
      </div>
    </Link>
  )
}

export default PendingRecoveryListItem
