import { trackEvent, WALLET_EVENTS } from '@/services/analytics'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { useEffect } from 'react'
import useChainId from './useChainId'
import { useLazyTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const events = {
  [TxEvent.SIGNED]: WALLET_EVENTS.OFFCHAIN_SIGNATURE,
  [TxEvent.PROCESSING]: WALLET_EVENTS.ONCHAIN_INTERACTION,
  [TxEvent.PROCESSING_MODULE]: WALLET_EVENTS.ONCHAIN_INTERACTION,
  [TxEvent.RELAYING]: WALLET_EVENTS.ONCHAIN_INTERACTION,
}

export const useTxTracking = (): void => {
  const chainId = useChainId()

  const [trigger] = useLazyTransactionsGetTransactionByIdV1Query()

  useEffect(() => {
    const unsubFns = Object.entries(events).map(([txEvent, analyticsEvent]) =>
      txSubscribe(txEvent as TxEvent, async (detail) => {
        const txId = 'txId' in detail ? detail.txId : undefined
        const txHash = 'txHash' in detail ? detail.txHash : undefined
        const id = txId || txHash

        let origin = ''

        if (id) {
          try {
            const { data: txDetails } = await trigger({ chainId, id })
            origin = txDetails?.safeAppInfo?.url || ''
          } catch {}
        }

        trackEvent({
          ...analyticsEvent,
          label: origin,
        })
      }),
    )

    return () => {
      unsubFns.forEach((unsub) => unsub())
    }
  }, [chainId, trigger])
}
