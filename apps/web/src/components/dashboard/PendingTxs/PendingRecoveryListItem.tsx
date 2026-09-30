import Link from 'next/link'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { ChevronRight } from 'lucide-react'
import type { ReactElement } from 'react'

import { RecoveryFeature } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'
import { AppRoutes } from '@/config/routes'
import type { RecoveryQueueItem } from '@/features/recovery'

import css from './styles.module.css'
import classnames from 'classnames'

function PendingRecoveryListItem({ transaction }: { transaction: RecoveryQueueItem }): ReactElement {
  const router = useRouter()
  const { RecoveryType, RecoveryInfo, RecoveryStatus } = useLoadFeature(RecoveryFeature)
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
