import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SpeedUpMonitor = gatedDynamic(FEATURES.SPEED_UP_TX, () => import('../../components/SpeedUpMonitor'))

export default SpeedUpMonitor
