import Link from 'next/link'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { ChevronRight } from '@mui/icons-material'
import { Box, Stack } from '@mui/material'
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
      <Box className={classnames(css.container, css.recoveryContainer)} sx={{ minHeight: 50 }}>
        <RecoveryType isMalicious={isMalicious} date={transaction.timestamp} isDashboard />

        <RecoveryInfo isMalicious={isMalicious} />

        <Stack direction="row" gap={1.5} alignItems="center" ml="auto">
          <RecoveryStatus recovery={transaction} />
          <ChevronRight color="border" fontSize="small" />
        </Stack>
      </Box>
    </Link>
  )
}

export default PendingRecoveryListItem
