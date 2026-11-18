import dynamic from '@/utils/dynamic'

// Not gated: the ledger feature is always enabled
const LedgerHashComparison = dynamic(() => import('../components/LedgerHashComparison'))

export default LedgerHashComparison
