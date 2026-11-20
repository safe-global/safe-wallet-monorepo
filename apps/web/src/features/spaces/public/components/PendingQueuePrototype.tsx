import dynamic from '@/utils/dynamic'

// Not gated by a chain flag: the page shows it in preview builds only
const PendingQueuePrototype = dynamic(() => import('../../prototype/components/PendingQueue'))

export default PendingQueuePrototype
