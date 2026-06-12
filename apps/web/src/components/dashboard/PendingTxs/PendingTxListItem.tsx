import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import NextLink from 'next/link'
import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { Typography } from '@/components/ui/typography'
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
      <div className={css.container}>
        <div className="flex flex-row items-center gap-3">
          <div className={css.iconWrapper}>
            <TxTypeIcon tx={transaction} />
          </div>
          <div>
            <Typography className={css.txDescription}>
              <TxTypeText tx={transaction} />
              <TxInfo info={transaction.txInfo} />
            </Typography>
            <Typography variant="paragraph-small" className="block text-[var(--color-primary-light)]">
              <DateTime value={transaction.timestamp} showDateTime={false} showTime={false} />
            </Typography>
          </div>
        </div>

        <div className={css.confirmations}>
          {isMultisigExecutionInfo(transaction.executionInfo) && (
            <TxConfirmations
              submittedConfirmations={transaction.executionInfo.confirmationsSubmitted}
              requiredConfirmations={transaction.executionInfo.confirmationsRequired}
            />
          )}
        </div>
      </div>
    </NextLink>
  )
}

export default PendingTx
