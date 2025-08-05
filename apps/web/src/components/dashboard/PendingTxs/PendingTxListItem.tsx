import NextLink from 'next/link'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import ChevronRight from '@mui/icons-material/ChevronRight'
import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { Box, Stack, Typography } from '@mui/material'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import TxInfo from '@/components/transactions/TxInfo'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import TxConfirmations from '@/components/transactions/TxConfirmations'
import { DateTime } from '@/components/common/DateTime/DateTime'

type PendingTxType = {
  transaction: TransactionSummary
}

const PendingTx = ({ transaction }: PendingTxType): ReactElement => {
  const router = useRouter()
  const { id } = transaction

  const url = useMemo(
    () => ({
      pathname: AppRoutes.transactions.tx,
      query: {
        id,
        safe: router.query.safe,
      },
    }),
    [router, id],
  )

  return (
    <NextLink data-testid="tx-pending-item" href={url} passHref>
      <Box className={css.container}>
        <Stack direction="row" gap={1.5} alignItems="center">
          <Box className={css.iconWrapper}>
            <TxTypeIcon tx={transaction} />
          </Box>
          <Box>
            <Typography className={css.txDescription}>
              <TxTypeText tx={transaction} />
              <TxInfo info={transaction.txInfo} />
            </Typography>
            <Typography variant="body2" color="primary.light">
              <DateTime value={transaction.timestamp} showDateTime={false} showTime={false} />
            </Typography>
          </Box>
        </Stack>

        <Box className={css.confirmations}>
          {isMultisigExecutionInfo(transaction.executionInfo) && (
            <TxConfirmations
              submittedConfirmations={transaction.executionInfo.confirmationsSubmitted}
              requiredConfirmations={transaction.executionInfo.confirmationsRequired}
            />
          )}

          <ChevronRight color="border" fontSize="small" />
        </Box>
      </Box>
    </NextLink>
  )
}

export default PendingTx
