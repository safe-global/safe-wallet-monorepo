import dynamic from '@/utils/dynamic'

// Not gated: the batching feature is always enabled
const BatchSidebar = dynamic(() => import('../../components/BatchSidebar'))

export default BatchSidebar
