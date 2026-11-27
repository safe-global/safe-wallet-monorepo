import dynamic from '@/utils/dynamic'

// Not gated on TX_NOTES: the Workspace queue has no current chain to read the flag from
const QueueNote = dynamic(() => import('../../components/QueueNote'))

export default QueueNote
