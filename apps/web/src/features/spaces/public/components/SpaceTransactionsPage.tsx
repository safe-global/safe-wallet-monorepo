import dynamic from '@/utils/dynamic'

// Not gated: the spaces feature is always enabled
const SpaceTransactionsPage = dynamic(() => import('../../components/SpaceTransactions/Page'))

export default SpaceTransactionsPage
