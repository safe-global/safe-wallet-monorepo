import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import NextLink from 'next/link'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import TxInfo from '@/components/transactions/TxInfo'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import TxConfirmations from '@/components/transactions/TxConfirmations'
import { DateTime } from '@/components/common/DateTime/DateTime'

type PendingTxType = {
  transaction: Transaction
}

const PendingTx = ({ transaction }: PendingTxType): ReactElement => {
  const { id } = transaction
  const safeQueryParam = useSafeQueryParam()

  const url = useMemo(
    () => ({
      pathname: AppRoutes.transactions.tx,
      query: {
        id,
        safe: safeQueryParam,
      },
    }),
    [safeQueryParam, id],
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
        </Box>
      </Box>
    </NextLink>
  )
}

export default PendingTx
