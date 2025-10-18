import ExternalStore from '@safe-global/utils/services/ExternalStore'

// External store for Ledger hash comparison
const ledgerHashStore = new ExternalStore<string | undefined>(undefined)

export const showLedgerHashComparison = (hash: string) => {
  ledgerHashStore.setStore(hash)
}

export const hideLedgerHashComparison = () => {
  ledgerHashStore.setStore(undefined)
}

export default ledgerHashStore
