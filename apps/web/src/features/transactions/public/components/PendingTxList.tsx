import dynamic from '@/utils/dynamic'

// Not gated: the transactions feature is always enabled
const PendingTxList = dynamic(() => import('../../components/PendingTxList'))

export default PendingTxList
