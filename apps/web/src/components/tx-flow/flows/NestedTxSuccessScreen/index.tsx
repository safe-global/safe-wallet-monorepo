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
import { Typography } from '@/components/ui/typography'
import { useCurrentChain } from '@/hooks/useChains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'

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

  const chain = useCurrentChain()

  // When the parent executed immediately (threshold 1), `txHashOrParentSafeTxHash` is a real
  // on-chain tx hash → link to the block explorer. Otherwise it is the parent's safeTxHash of a
  // queued tx → deep-link to the parent's transaction detail so it can be confirmed.
  const isExecuted = cachedPendingTx?.status === PendingStatus.NESTED_SIGNING && cachedPendingTx.executed
  const explorerLink =
    isExecuted && chain
      ? getExplorerLink(cachedPendingTx.txHashOrParentSafeTxHash, chain.blockExplorerUriTemplate)
      : undefined

  if (cachedPendingTx?.status !== PendingStatus.NESTED_SIGNING) {
    return <ErrorMessage>No transaction data found</ErrorMessage>
  }

  const currentSafeAddress = addressBook[cachedPendingTx.safeAddress]
  const parentSafeAddress = addressBook[cachedPendingTx.signerAddress]
  const isExecTransaction = cachedPendingTx.method === 'execTransaction'

  return (
    <div className="mx-auto w-full max-w-[825px] rounded-lg bg-[var(--color-background-paper)] text-center">
      <div className="mt-6 flex flex-col items-center gap-4 p-6">
        <div className={css.icon}>
          <NestedSafeIcon className="size-9" aria-label="Nested Safe" />
        </div>
        <Typography data-testid="transaction-status" variant="h4" className="mt-4">
          {isExecuted ? 'Transaction submitted' : 'One more step in the parent Safe'}
        </Typography>
        <Typography variant="paragraph-small" className="mb-6 block">
          {isExecuted
            ? 'The parent Safe executed this transaction on-chain.'
            : isExecTransaction
              ? "Executing as the parent Safe created a transaction inside it. The parent Safe's owners still need to confirm and execute that transaction before this Safe's transaction runs."
              : "Signing as the parent Safe created an approval transaction inside it. The parent Safe's owners still need to confirm and execute that transaction before it signs this Safe's transaction."}
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
              {cachedPendingTx.method}
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
          {explorerLink ? (
            <ExternalLink href={explorerLink.href} mode="button">
              Open the transaction
            </ExternalLink>
          ) : (
            <Link
              href={{
                pathname: AppRoutes.transactions.tx,
                query: {
                  safe: cachedPendingTx.signerAddress,
                  chainId: cachedPendingTx.chainId,
                  id: cachedPendingTx.txHashOrParentSafeTxHash,
                },
              }}
              passHref
              legacyBehavior
            >
              <ExternalLink mode="button">Open the transaction</ExternalLink>
            </Link>
          )}
        </Track>
      </div>
    </div>
  )
}

export default NestedTxSuccessScreen
