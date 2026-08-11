import { useState, useEffect } from 'react'
import { PendingStatus, selectPendingTxById } from '@/store/pendingTxsSlice'
import EthHashInfo from '@/components/common/EthHashInfo'
import ErrorMessage from '@/components/tx/ErrorMessage'
import useAddressBook from '@/hooks/useAddressBook'
import NestedSafeIcon from '@/public/images/transactions/nestedTx.svg'
import ArrowDownIcon from '@/public/images/common/arrow-down.svg'

import css from './styles.module.css'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import ExternalLink from '@/components/common/ExternalLink'
import { MODALS_EVENTS } from '@/services/analytics'
import Track from '@/components/common/Track'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { getSafeTransaction } from '@/utils/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { Typography } from '@/components/ui/typography'

type Props = {
  txId: string
}
const NestedTxSuccessScreen = ({ txId }: Props) => {
  const addressBook = useAddressBook()

  // _pendingTx eventually clears from the store, so we need to cache it
  const _pendingTx = useAppSelector((state) => (txId ? selectPendingTxById(state, txId) : undefined))
  const [cachedPendingTx, setCachedPendingTx] = useState(_pendingTx)
  useEffect(() => {
    if (_pendingTx) {
      setCachedPendingTx(_pendingTx)
    }
  }, [_pendingTx])

  const [safeTx] = useAsync(() => {
    if (cachedPendingTx?.status == PendingStatus.NESTED_SIGNING) {
      return getSafeTransaction(
        cachedPendingTx.txHashOrParentSafeTxHash,
        cachedPendingTx.chainId,
        cachedPendingTx.signerAddress,
      )
    }
  }, [cachedPendingTx])
  const isSafeTxHash =
    cachedPendingTx?.status == PendingStatus.NESTED_SIGNING &&
    !!safeTx &&
    isMultisigDetailedExecutionInfo(safeTx.detailedExecutionInfo) &&
    safeTx.detailedExecutionInfo.safeTxHash === cachedPendingTx.txHashOrParentSafeTxHash

  if (cachedPendingTx?.status !== PendingStatus.NESTED_SIGNING) {
    return <ErrorMessage>No transaction data found</ErrorMessage>
  }

  const currentSafeAddress = addressBook[cachedPendingTx.safeAddress]
  const parentSafeAddress = addressBook[cachedPendingTx.signerAddress]

  return (
    <div className="mx-auto w-full max-w-[825px] rounded-lg bg-[var(--color-background-paper)] text-center">
      <div className="mt-6 flex flex-col items-center gap-4 p-6">
        <div className={css.icon}>
          <NestedSafeIcon className="size-9" aria-label="Nested Safe" />
        </div>
        <Typography data-testid="transaction-status" variant="h4" className="mt-4">
          A nested transaction was created
        </Typography>
        <Typography variant="paragraph-small" className="mb-6 block">
          Once confirmed and executed this signer transaction will confirm the child Safe&apos;s transaction.
        </Typography>
        <div className="flex w-[70%] flex-col gap-4">
          <div className="flex flex-col items-start gap-2">
            <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
              Parent Safe
            </Typography>
            <EthHashInfo address={cachedPendingTx.signerAddress} name={parentSafeAddress} shortAddress={false} />
          </div>
          <div className="flex flex-row items-center gap-4 pl-2">
            <ArrowDownIcon className="size-6 text-[var(--color-border-main)]" />
            <Typography
              variant="code"
              className="rounded-sm bg-[var(--color-background-main)] px-2 py-0.5 font-mono whitespace-nowrap text-[var(--color-primary-light)]"
            >
              approveHash
            </Typography>
          </div>
          <div className="flex flex-col items-start gap-2">
            <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
              Current Safe
            </Typography>
            <EthHashInfo address={cachedPendingTx.safeAddress} name={currentSafeAddress} shortAddress={false} />
          </div>
        </div>
        <Track {...MODALS_EVENTS.OPEN_PARENT_TX}>
          <Link
            href={
              isSafeTxHash
                ? {
                    pathname: AppRoutes.transactions.tx,
                    query: {
                      safe: cachedPendingTx.signerAddress,
                      chainId: cachedPendingTx.chainId,
                      id: cachedPendingTx.txHashOrParentSafeTxHash,
                    },
                  }
                : {
                    pathname: AppRoutes.transactions.queue,
                    query: {
                      safe: cachedPendingTx.signerAddress,
                      chainId: cachedPendingTx.chainId,
                    },
                  }
            }
            passHref
            legacyBehavior
          >
            <ExternalLink mode="button">Open the transaction</ExternalLink>
          </Link>
        </Track>
      </div>
    </div>
  )
}

export default NestedTxSuccessScreen
