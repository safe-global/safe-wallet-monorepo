import dynamic from 'next/dynamic'

// Type exports
export type { TransactionHash, LedgerHashState, ShowHashFunction, HideHashFunction } from './types'

// Store function exports
export { showLedgerHashComparison, hideLedgerHashComparison } from './store'

// Lazy-loaded component (default export)
const LedgerHashComparison = dynamic(
  () => import('./components/LedgerHashComparison').then((mod) => ({ default: mod.default })),
  { ssr: false },
)

export default LedgerHashComparison
