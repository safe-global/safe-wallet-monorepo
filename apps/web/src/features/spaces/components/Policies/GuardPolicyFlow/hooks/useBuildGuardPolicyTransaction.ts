import { useContext, useEffect, useMemo } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender/create'
import type { PolicyBatch } from '../../shared/buildPolicyBatch'

export type GuardPolicyBuild = { batch: PolicyBatch; error?: undefined } | { batch?: undefined; error?: Error }

/**
 * Turns a guard policy's batch into the Safe transaction for the Safe the flow is scoped to and hands it to
 * `SafeTxProvider`, so the shared Sign/Execute steps take over. As `useBuildPolicyTransaction` does for spending
 * limits, any change to the batch drops the transaction first, and a build a later run made stale is discarded.
 */
export const useBuildGuardPolicyTransaction = ({ batch, error }: GuardPolicyBuild): void => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const scope = useSafeScope()

  // The batch is rebuilt every render; its transactions are what the Safe transaction describes.
  const txsKey = batch ? JSON.stringify(batch.txs) : undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const txs = useMemo(() => batch?.txs, [txsKey])
  // So is the error; the message is what the review shows.
  const errorMessage = error?.message
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const blocker = useMemo(() => error, [errorMessage])

  const sdk = scope?.sdk
  const chainId = scope?.chainId

  useEffect(() => {
    setSafeTx(undefined)
    setSafeTxError(blocker)
    if (blocker || !txs || !sdk || !chainId || !scope) return

    let isStale = false
    createMultiSendCallOnlyTx(txs, scope)
      .then((tx) => {
        if (!isStale) setSafeTx(tx)
      })
      .catch((e) => {
        if (!isStale) setSafeTxError(e)
      })
    return () => {
      isStale = true
    }
    // `scope` is a new object on every Safe poll; the build only depends on its SDK and chain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker, txs, sdk, chainId, setSafeTx, setSafeTxError])
}
