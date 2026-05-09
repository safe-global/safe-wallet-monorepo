import ExternalStore from '@safe-global/utils/services/ExternalStore'
import type { LedgerHashState } from '../types'

// External store for Ledger hash comparison
const ledgerHashStore = new ExternalStore<LedgerHashState>(undefined)

export const showLedgerHashComparison = (hash: string) => {
  ledgerHashStore.setStore(hash)
}

export const hideLedgerHashComparison = () => {
  ledgerHashStore.setStore(undefined)
}

export default ledgerHashStore
