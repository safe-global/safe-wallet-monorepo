import dynamic from '@/utils/dynamic'

// Not gated: the dashboard checks the POSITIONS flag before it renders the widget
const PositionsWidget = dynamic(() => import('../../components/PositionsWidget'))

export default PositionsWidget
