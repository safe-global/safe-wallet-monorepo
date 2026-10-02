import ExternalStore from '@safe-global/utils/services/ExternalStore'
import local from '@/services/local-storage/local'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { getSafeTxHashFromTxId } from '@/utils/transactions'

const STORAGE_KEY = 'safenetPrototypeCheckStarts'

type CheckStarts = Record<string, number>

const store = new ExternalStore<CheckStarts>(local.getItem<CheckStarts>(STORAGE_KEY) ?? {})

const persist = (starts: CheckStarts): CheckStarts => {
  local.setItem(STORAGE_KEY, starts)
  return starts
}

/** Starts the mock check for a transaction. Only the first call counts: each real check costs money. */
export const recordCheckStart = (safeTxHash: string, nowMs: number = Date.now()): void => {
  store.setStore((prev = {}) => (safeTxHash in prev ? prev : persist({ ...prev, [safeTxHash]: nowMs })))
}

export const clearCheckStarts = (): void => {
  store.setStore(persist({}))
}

let unsubscribe: (() => void) | undefined

/** MOCK: the real check starts on-chain at the first signature, which is when a tx gets proposed. */
export const startRecordingCheckStarts = (): void => {
  unsubscribe ??= txSubscribe(TxEvent.PROPOSED, ({ txId }) => {
    const safeTxHash = getSafeTxHashFromTxId(txId)
    if (safeTxHash) recordCheckStart(safeTxHash)
  })
}

export const stopRecordingCheckStarts = (): void => {
  unsubscribe?.()
  unsubscribe = undefined
}

/** When the check for this transaction started in this browser, if it did. */
export const useCheckStartedAt = (safeTxHash: string | undefined): number | undefined => {
  const starts = store.useStore()
  return safeTxHash ? starts?.[safeTxHash] : undefined
}
