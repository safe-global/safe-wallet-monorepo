import dynamic from '@/utils/dynamic'

// Not gated: the positions page shows its own state while positions are unavailable
const Positions = dynamic(() => import('../../components/Positions'))

export default Positions
